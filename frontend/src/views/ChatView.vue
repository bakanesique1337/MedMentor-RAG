<script setup lang="ts">
/**
 * ChatView — страница симуляции диалога с виртуальным пациентом.
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
import {useSimulationSession} from '@/composables/simulation/useSimulationSession'
import {useSimulationSocket} from '@/composables/simulation/useSimulationSocket'
import {useSimulationStream} from '@/composables/simulation/useSimulationStream'
import {
    CHAT_ACTIONS_TEXTS,
    CHAT_ALERTS_TEXTS,
    CHAT_STATUS_TEXTS,
} from '@/constants/chatViewTexts'
import {SIMULATION_QUICK_PROMPTS, type SimulationQuickPromptKey} from '@/constants/simulationQuickPrompts'
import {useSidebarStore} from '@/stores/sidebar'
import {MESSAGE_ROLE, OPENING_STATUS, SIMULATION_STATE} from '@/types'

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

// Quick-prompt'ы — одноразовые: лабораторные/инструментальные/осмотр имеют смысл
// один раз за сессию. Признак «уже нажата» восстанавливается из серверного состояния
// (examRevealed для осмотра, совпадение по content среди DOCTOR-сообщений для остальных),
// чтобы кнопка оставалась disabled и после перезагрузки страницы.
const disabledQuickPromptKeys = computed<ReadonlySet<SimulationQuickPromptKey>>(() => {
    const used = new Set<SimulationQuickPromptKey>()
    if (session.value === null) return used
    if (session.value.examRevealed) {
        used.add('physical-exam')
    }
    const doctorContents = new Set(
        session.value.messages
            .filter((message) => message.role === MESSAGE_ROLE.DOCTOR)
            .map((message) => message.content),
    )
    for (const prompt of SIMULATION_QUICK_PROMPTS) {
        if (prompt.content !== undefined && doctorContents.has(prompt.content)) {
            used.add(prompt.key)
        }
    }
    return used
})

const isOpeningPending = computed<boolean>(() =>
    session.value?.openingStatus === OPENING_STATUS.PENDING
    || session.value?.openingStatus === OPENING_STATUS.STREAMING,
)
const isOpeningFailed = computed<boolean>(() => session.value?.openingStatus === OPENING_STATUS.FAILED)
const isDiagnosisPhase = computed<boolean>(() => session.value?.state === SIMULATION_STATE.DIAGNOSIS_SELECT)
const isScoringPhase = computed<boolean>(() => session.value?.state === SIMULATION_STATE.SCORING)

onMounted(async () => {
    // sessionId приходит из URL и должен быть положительным целым.
    const raw = route.params.sessionId
    const id = typeof raw === 'string' ? parseInt(raw, 10) : NaN

    if (!Number.isInteger(id) || id <= 0) {
        pageError.value = CHAT_ALERTS_TEXTS.invalidSessionId
        isLoading.value = false
        return
    }

    sessionId.value = id
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
            class="mx-auto flex max-w-4xl flex-col gap-[1.6rem] px-[1.6rem] py-[6.4rem]"
        >
            <VAlert
                status="error"
                :title="CHAT_ALERTS_TEXTS.sessionUnavailableTitle"
                :description="pageError"
            />

            <div>
                <VButton
                    variant="secondary"
                    @click="handleBack"
                >
                    {{ CHAT_ACTIONS_TEXTS.backToCases }}
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
                        {{ CHAT_STATUS_TEXTS.openingPending }}
                    </p>

                    <div
                        v-if="streamingContent"
                        class="w-full max-w-6xl rounded-lg border border-(--color-line) bg-white px-[1.6rem] py-[1.2rem] shadow-card"
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
                        :title="CHAT_ALERTS_TEXTS.openingFailedTitle"
                        :description="CHAT_ALERTS_TEXTS.openingFailedDescription"
                    />
                    <div class="flex gap-[1.2rem]">
                        <VButton @click="handleRetryOpening">{{ CHAT_ACTIONS_TEXTS.retry }}</VButton>
                        <VButton
                            variant="ghost"
                            @click="handleBack"
                        >
                            {{ CHAT_ACTIONS_TEXTS.backToCases }}
                        </VButton>
                    </div>
                </div>

                <div
                    v-else-if="isScoringPhase"
                    class="flex flex-1 flex-col items-center justify-center gap-[1.2rem]"
                >
                    <VSpinner size="lg"/>
                    <p class="text-[1.4rem] text-text-secondary">{{ CHAT_STATUS_TEXTS.scoring }}</p>
                </div>

                <template v-else>
                    <ChatTimeline
                        :messages="session.messages"
                        :pending-doctor-message="pendingSentMessage"
                        :streaming-content="streamingContent"
                        :streaming-kind="activeStreamKind"
                        :patient-name="session.patientName"
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
                        :disabled-quick-prompt-keys="disabledQuickPromptKeys"
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
