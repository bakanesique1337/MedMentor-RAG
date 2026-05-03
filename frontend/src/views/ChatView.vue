<script setup lang="ts">
/**
 * ChatView — страница симуляции диалога с виртуальным пациентом.
 *
 * Роль в архитектуре: тонкий controller component, который собирает воедино
 * пять независимых композаблов и передаёт их состояние в дочерние компоненты.
 * Сама бизнес-логика вынесена из view, чтобы файл оставался обозримым и тестируемым.
 *
 * Композаблы и их зоны ответственности:
 *  - useSimulationSocket   — низкоуровневый STOMP/WebSocket клиент;
 *  - useSimulationSession  — загрузка сессии, спиннер, редирект на /result;
 *  - useSimulationStream   — буферы и состояние WebSocket-стрима модели;
 *  - useChatActions        — действия врача (send/diagnose/abandon/exam/retry)
 *                            + computed-гарды (canSend/canDiagnose/canFinish);
 *  - useChatModals         — состояние двух модалок подтверждения;
 *  - useInlineExamCard     — видимость инлайновой карточки осмотра в ленте.
 *
 * Жизненный цикл сессии описывается двумя независимыми полями:
 *  - state: IN_PROGRESS -> DIAGNOSIS_SELECT -> SCORING -> COMPLETED/ABANDONED;
 *  - openingStatus: OPENING_PENDING -> OPENING_STREAMING -> OPENING_READY,
 *    либо OPENING_FAILED как терминальный сбой (доступна кнопка "Повторить").
 *
 * Зависимости между композаблами разрешены через DI (передачей параметрами и refs),
 * чтобы исключить циклические импорты и упростить независимое тестирование.
 */
import {computed, onMounted, onUnmounted, ref} from 'vue'
import {useRoute} from 'vue-router'

import ChatInputBar from '@/components/chat/ChatInputBar.vue'
import ChatSidebar from '@/components/chat/ChatSidebar.vue'
import ChatTimeline from '@/components/chat/ChatTimeline.vue'
import ChatTopBar from '@/components/chat/ChatTopBar.vue'
import DiagnosisConfirmModal from '@/components/chat/DiagnosisConfirmModal.vue'
import DiagnosisPanel from '@/components/chat/DiagnosisPanel.vue'
import FinishCaseModal from '@/components/chat/FinishCaseModal.vue'
import {VAlert, VButton, VSpinner} from '@/components/ui'
import {useChatActions} from '@/composables/chat/useChatActions'
import {useChatModals} from '@/composables/chat/useChatModals'
import {useInlineExamCard} from '@/composables/chat/useInlineExamCard'
import {useSimulationSession} from '@/composables/simulation/useSimulationSession'
import {useSimulationSocket} from '@/composables/simulation/useSimulationSocket'
import {useSimulationStream} from '@/composables/simulation/useSimulationStream'
import {SIMULATION_QUICK_PROMPTS} from '@/constants/simulationQuickPrompts'
import {useSidebarStore} from '@/stores/sidebar'
import {OPENING_STATUS, SIMULATION_STATE} from '@/types'

const COPY = {
    sessionUnavailableTitle: 'Сессия недоступна',
    backToCasesButton: 'К списку кейсов',
    openingPendingMessage: 'Пациент готовит вступление...',
    openingFailedTitle: 'Опенинг не удался',
    openingFailedDescription: 'Вступление пациента не удалось сгенерировать.',
    retryButton: 'Повторить',
    scoringMessage: 'Модель оценивает вашу сессию...',
    invalidSessionId: 'Некорректный ID сессии. Вернитесь к списку кейсов.',
} as const

const route = useRoute()
const sidebarStore = useSidebarStore()

// Сокет создаётся ОДИН раз и шарится между сессией и стримом — иначе бы открылись
// два независимых WebSocket-соединения, что приводит к дубликатам подписок и чанков.
const socket = useSimulationSocket()

const sessionId = ref(0)

const {
    session,
    isLoading,
    pageError,
    fetchSession,
    reloadSession,
} = useSimulationSession({sessionId, socket})

// Стрим завязан на сессию двумя callback'ами: на 'done' тихо перетягиваем канонические
// сообщения (reloadSession), на 'error' делаем полный перезапуск (fetchSession).
const stream = useSimulationStream({
    sessionId,
    session,
    socket,
    onStreamDone: reloadSession,
    onStreamError: fetchSession,
})
const {
    streamingContent,
    pendingSentMessage,
    activeStreamKind,
    streamErrorMessage,
} = stream

const {
    isFinishModalOpen,
    isDiagnosisModalOpen,
    openFinishModal,
    openDiagnosisModal,
    closeFinishModal,
    closeDiagnosisModal,
} = useChatModals()

const {
    isSendPending,
    isDiagnosisPending,
    isAbandonPending,
    conflictMessage,
    canSendMessage,
    canFinishCase,
    canDiagnose,
    handleSend,
    handleDiagnose,
    handleAbandon,
    handleRequestExam,
    handleRetryOpening,
    handleBack,
} = useChatActions({
    sessionId,
    session,
    pageError,
    stream,
    socket,
    fetchSession,
    closeFinishModal,
    closeDiagnosisModal,
})

const {showInlineExamCard} = useInlineExamCard(session)

// Локальные computed'ы — чисто шаблонные condition'ы, не используются за пределами view.
const isOpeningPending = computed<boolean>(() =>
    session.value?.openingStatus === OPENING_STATUS.PENDING
    || session.value?.openingStatus === OPENING_STATUS.STREAMING,
)
const isOpeningFailed = computed<boolean>(() => session.value?.openingStatus === OPENING_STATUS.FAILED)
const isDiagnosisPhase = computed<boolean>(() => session.value?.state === SIMULATION_STATE.DIAGNOSIS_SELECT)
const isScoringPhase = computed<boolean>(() => session.value?.state === SIMULATION_STATE.SCORING)

onMounted(async () => {
    // sessionId приходит из URL и должен быть положительным целым.
    // Любая невалидная форма — это либо опечатка, либо испорченная ссылка;
    // в обоих случаях показываем ошибку и не дёргаем бэкенд впустую.
    const raw = route.params.sessionId
    const id = typeof raw === 'string' ? parseInt(raw, 10) : NaN

    if (!Number.isInteger(id) || id <= 0) {
        pageError.value = COPY.invalidSessionId
        isLoading.value = false
        return
    }

    sessionId.value = id
    // Параллельная загрузка: сама сессия + счётчик кейсов в сайдбаре независимы.
    await Promise.all([
        fetchSession(),
        sidebarStore.fetchCasesCount(),
    ])
})

onUnmounted(() => {
    socket.disconnect()
})
</script>

<template>
    <div class="flex h-full flex-1 overflow-hidden">
        <div
            v-if="isLoading"
            class="flex flex-1 items-center justify-center"
        >
            <VSpinner size="lg"/>
        </div>

        <div
            v-else-if="pageError && !session"
            class="mx-auto flex max-w-[56rem] flex-col gap-[1.6rem] px-[1.6rem] py-[6.4rem]"
        >
            <VAlert
                status="error"
                :title="COPY.sessionUnavailableTitle"
                :description="pageError"
            />
            <div>
                <VButton
                    variant="secondary"
                    @click="handleBack"
                >
                    {{ COPY.backToCasesButton }}
                </VButton>
            </div>
        </div>

        <template v-else-if="session">
            <ChatSidebar
                :session="session"
                :session-id="sessionId"
                :cases-count="sidebarStore.casesCount"
                :is-abandon-pending="isAbandonPending"
                class="hidden lg:flex"
                @abandon="handleAbandon"
                @request-exam="handleRequestExam"
            />

            <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
                <ChatTopBar
                    :session="session"
                    :session-id="sessionId"
                    :can-finish="canFinishCase"
                    :can-diagnose="canDiagnose"
                    :is-abandon-pending="isAbandonPending"
                    @back="handleBack"
                    @finish="openFinishModal"
                    @diagnose="openDiagnosisModal"
                />

                <div
                    v-if="pageError || (conflictMessage && !isDiagnosisPhase)"
                    class="shrink-0 px-[2.4rem] pt-[1.2rem]"
                >
                    <VAlert
                        :status="conflictMessage ? 'warning' : 'error'"
                        :description="conflictMessage ?? pageError ?? ''"
                    />
                </div>

                <div
                    v-if="streamErrorMessage"
                    class="shrink-0 px-[2.4rem] pt-[1.2rem]"
                >
                    <VAlert
                        status="warning"
                        :description="streamErrorMessage"
                    />
                </div>

                <div
                    v-if="isOpeningPending"
                    class="flex flex-1 flex-col items-center justify-center gap-[1.6rem] px-[1.6rem] py-[3.2rem]"
                >
                    <VSpinner size="lg"/>
                    <p class="text-[1.4rem] text-text-secondary">
                        {{ COPY.openingPendingMessage }}
                    </p>
                    <div
                        v-if="streamingContent"
                        class="w-full max-w-[72rem] rounded-[1.4rem] border border-[color:var(--color-line)] bg-white px-[1.6rem] py-[1.2rem] shadow-card"
                    >
                        <p class="text-[1.4rem] text-text-primary">{{ streamingContent }}</p>
                    </div>
                </div>

                <div
                    v-else-if="isOpeningFailed"
                    class="flex flex-1 flex-col items-center justify-center gap-[1.6rem] px-[1.6rem] py-[3.2rem]"
                >
                    <VAlert
                        status="error"
                        :title="COPY.openingFailedTitle"
                        :description="COPY.openingFailedDescription"
                    />
                    <div class="flex gap-[1.2rem]">
                        <VButton @click="handleRetryOpening">{{ COPY.retryButton }}</VButton>
                        <VButton
                            variant="ghost"
                            @click="handleBack"
                        >
                            {{ COPY.backToCasesButton }}
                        </VButton>
                    </div>
                </div>

                <div
                    v-else-if="isScoringPhase"
                    class="flex flex-1 flex-col items-center justify-center gap-[1.2rem]"
                >
                    <VSpinner size="lg"/>
                    <p class="text-[1.4rem] text-text-secondary">{{ COPY.scoringMessage }}</p>
                </div>

                <template v-else>
                    <ChatTimeline
                        :messages="session.messages"
                        :pending-doctor-message="pendingSentMessage"
                        :streaming-content="streamingContent"
                        :streaming-kind="activeStreamKind"
                        :patient-name="session.patientName"
                        :exam-revealed="showInlineExamCard"
                        :passport="session.passport"
                        :vitals="session.vitals"
                    />

                    <DiagnosisPanel
                        v-if="isDiagnosisPhase"
                        :diagnosis-options="session.diagnosisOptions"
                        :is-pending="isDiagnosisPending"
                        :conflict-message="conflictMessage"
                        @diagnose="handleDiagnose"
                    />

                    <ChatInputBar
                        v-else
                        :disabled="!canSendMessage"
                        :is-send-pending="isSendPending"
                        :quick-prompts="SIMULATION_QUICK_PROMPTS"
                        @send="handleSend"
                        @request-exam="handleRequestExam"
                    />
                </template>
            </div>

            <FinishCaseModal
                v-model="isFinishModalOpen"
                :session-id="sessionId"
                :is-pending="isAbandonPending"
                @confirm="handleAbandon"
            />

            <DiagnosisConfirmModal
                v-model="isDiagnosisModalOpen"
                :session-id="sessionId"
                :is-pending="isDiagnosisPending"
                :conflict-message="conflictMessage"
                @diagnose="handleDiagnose"
            />
        </template>
    </div>
</template>
