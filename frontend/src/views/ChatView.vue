<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ChatInputBar from '@/components/chat/ChatInputBar.vue'
import ChatSidebar from '@/components/chat/ChatSidebar.vue'
import ChatTimeline from '@/components/chat/ChatTimeline.vue'
import ChatTopBar from '@/components/chat/ChatTopBar.vue'
import DiagnosisConfirmModal from '@/components/chat/DiagnosisConfirmModal.vue'
import DiagnosisPanel from '@/components/chat/DiagnosisPanel.vue'
import FinishCaseModal from '@/components/chat/FinishCaseModal.vue'
import { VAlert, VButton, VSpinner } from '@/components/ui'
import { ROUTES } from '@/constants/routes'
import { SIMULATION_QUICK_PROMPTS } from '@/constants/simulationQuickPrompts'
import { useSimulationApi } from '@/composables/useSimulationApi'
import { useSimulationSocket } from '@/composables/useSimulationSocket'
import { useSidebarStore } from '@/stores/sidebar'
import type { SimulationSession, StreamChunk } from '@/types'
import { isApiError } from '@/types'

const COPY = {
    sessionUnavailableTitle: 'Сессия недоступна',
    backToCasesButton: 'К списку кейсов',
    openingPendingMessage: 'Пациент готовит вступление...',
    openingFailedTitle: 'Опенинг не удался',
    openingFailedDescription: 'Вступление пациента не удалось сгенерировать.',
    retryButton: 'Повторить',
    scoringMessage: 'Модель оценивает вашу сессию...',
} as const

const route = useRoute()
const router = useRouter()
const simulationApi = useSimulationApi()
const socket = useSimulationSocket()
const sidebarStore = useSidebarStore()

const sessionId = ref(0)
const session = ref<SimulationSession | null>(null)
const isLoading = ref(true)
const pageError = ref<string | null>(null)

const streamingContent = ref('')
const pendingSentMessage = ref<string | null>(null)
const activeStreamKind = ref<'opening' | 'message' | null>(null)

const streamErrorMessage = ref<string | null>(null)

const isSendPending = ref(false)
const isDiagnosisPending = ref(false)
const isAbandonPending = ref(false)
const isExamPending = ref(false)
const conflictMessage = ref<string | null>(null)

const isFinishModalOpen = ref(false)
const isDiagnosisModalOpen = ref(false)

const isOpeningPending = computed(() =>
    session.value?.openingStatus === 'OPENING_PENDING'
    || session.value?.openingStatus === 'OPENING_STREAMING',
)
const isOpeningFailed = computed(() => session.value?.openingStatus === 'OPENING_FAILED')
const isDiagnosisPhase = computed(() => session.value?.state === 'DIAGNOSIS_SELECT')
const isScoringPhase = computed(() => session.value?.state === 'SCORING')

const canSendMessage = computed(() =>
    session.value !== null
    && pageError.value === null
    && session.value.openingStatus === 'OPENING_READY'
    && session.value.state === 'IN_PROGRESS'
    && activeStreamKind.value === null
    && !isSendPending.value,
)

const canFinishCase = computed(() =>
    session.value !== null
    && session.value.state !== 'COMPLETED'
    && session.value.state !== 'ABANDONED'
    && session.value.state !== 'SCORING',
)

const canDiagnose = computed(() =>
    session.value !== null
    && session.value.openingStatus === 'OPENING_READY'
    && session.value.state === 'IN_PROGRESS'
    && activeStreamKind.value === null,
)

watch(socket.status, (newStatus) => {
    if (newStatus === 'error' && activeStreamKind.value !== null) {
        activeStreamKind.value = null
        streamingContent.value = ''
        pendingSentMessage.value = null
        streamErrorMessage.value = 'Соединение потеряно. Попробуйте снова или перезагрузите страницу.'
    }
})

/**
 * Resolves the correct active stream kind from backend session state.
 */
function resolveStreamKind(data: SimulationSession): 'opening' | 'message' | null {
    if (data.streamingStatus.inFlight) {
        return data.streamingStatus.type === 'message' ? 'message' : 'opening'
    }
    if (data.openingStatus === 'OPENING_PENDING' || data.openingStatus === 'OPENING_STREAMING') {
        return 'opening'
    }
    return null
}

/**
 * Fetches session state from REST.
 */
async function fetchSession(options?: { retryOpening?: boolean }): Promise<void> {
    isLoading.value = true
    pageError.value = null

    try {
        const data = await simulationApi.getSession(sessionId.value, options)
        session.value = data

        if (data.state === 'COMPLETED' || data.state === 'ABANDONED') {
            await router.replace({
                name: ROUTES.RESULT,
                params: { sessionId: String(sessionId.value) },
            }).catch(() => undefined)
            return
        }

        const streamKind = resolveStreamKind(data)
        activeStreamKind.value = streamKind
        streamErrorMessage.value = null

        socket.connect(sessionId.value)
    } catch {
        pageError.value = 'Сессия не найдена или не может быть загружена. Вернитесь к списку кейсов.'
    } finally {
        isLoading.value = false
    }
}

/**
 * Handles an incoming stream chunk from the WebSocket.
 */
function handleChunk(chunk: StreamChunk): void {
    if (chunk.type === 'chunk' && typeof chunk.content === 'string') {
        streamingContent.value += chunk.content
    } else if (chunk.type === 'done') {
        refreshAfterStream()
    } else if (chunk.type === 'error') {
        const failedKind = activeStreamKind.value
        activeStreamKind.value = null
        streamingContent.value = ''
        pendingSentMessage.value = null

        if (failedKind === 'opening') {
            streamErrorMessage.value = 'Опенинг не удалось получить в реальном времени. Перезагружаем сессию…'
        } else {
            streamErrorMessage.value = 'Ответ пациента не удалось получить в реальном времени. Перезагружаем…'
        }
        fetchSession()
    }
}

/**
 * Fetches fresh session state after a stream completes.
 */
async function refreshAfterStream(): Promise<void> {
    try {
        const data = await simulationApi.getSession(sessionId.value)
        session.value = data
    } catch {
        pageError.value = 'Не удалось обновить сессию после ответа. Перезагрузите страницу.'
    } finally {
        activeStreamKind.value = null
        streamingContent.value = ''
        pendingSentMessage.value = null
    }
}

/**
 * Sends a doctor message and starts the patient response stream.
 */
async function handleSend(content: string): Promise<void> {
    if (!canSendMessage.value) return

    isSendPending.value = true
    conflictMessage.value = null
    pendingSentMessage.value = content

    try {
        await simulationApi.sendMessage(sessionId.value, content)
        activeStreamKind.value = 'message'
        isSendPending.value = false
        streamingContent.value = ''
        socket.connect(sessionId.value)
    } catch (err: unknown) {
        isSendPending.value = false
        pendingSentMessage.value = null

        if (isApiError(err) && err.status === 409) {
            conflictMessage.value = 'Пациент ещё отвечает. Подождите, пока ответ завершится.'
        } else {
            pageError.value = 'Не удалось отправить сообщение. Попробуйте снова.'
        }
    }
}

/**
 * Submits the selected diagnosis.
 */
async function handleDiagnose(payload: {
    diagnosis: string
    rationale: string | null
    confidence: number | null
}): Promise<void> {
    if (isDiagnosisPending.value) return

    isDiagnosisPending.value = true
    conflictMessage.value = null

    try {
        const updated = await simulationApi.diagnose(sessionId.value, payload)
        session.value = updated
        isDiagnosisPending.value = false
        isDiagnosisModalOpen.value = false
        if (updated.state === 'COMPLETED' || updated.state === 'ABANDONED') {
            socket.disconnect()
            await router.push({
                name: ROUTES.RESULT,
                params: { sessionId: String(sessionId.value) },
            })
        }
    } catch (err: unknown) {
        if (isApiError(err) && err.status === 409) {
            conflictMessage.value = 'Диагноз нельзя отправить на этом этапе. Перезагружаем состояние…'
            await fetchSession()
            isDiagnosisPending.value = false
            isDiagnosisModalOpen.value = false
            return
        }
        pageError.value = 'Не удалось отправить диагноз. Попробуйте снова.'
        isDiagnosisPending.value = false
    }
}

/**
 * Opens the diagnosis confirmation modal.
 */
function handleOpenDiagnose(): void {
    isDiagnosisModalOpen.value = true
}

/**
 * Opens the finish-case confirmation modal.
 */
function handleOpenFinish(): void {
    isFinishModalOpen.value = true
}

/**
 * Retries the session opening via REST.
 */
async function handleRetryOpening(): Promise<void> {
    socket.disconnect()
    activeStreamKind.value = null
    streamErrorMessage.value = null
    streamingContent.value = ''
    await fetchSession({ retryOpening: true })
}

/**
 * Navigates back to the cases list.
 */
function handleBack(): void {
    router.push({ name: ROUTES.CASES }).catch(() => undefined)
}

/**
 * Abandons the current simulation and returns to the cases list.
 */
async function handleAbandon(): Promise<void> {
    if (isAbandonPending.value) return
    isAbandonPending.value = true
    try {
        await simulationApi.abandon(sessionId.value)
        socket.disconnect()
        sidebarStore.clearActiveSession()
        isFinishModalOpen.value = false
        await router.push({ name: ROUTES.CASES })
    } catch (err: unknown) {
        if (isApiError(err)) {
            const detail = err.error ? ` (${err.status}: ${err.error})` : ` (${err.status})`
            pageError.value = `Не удалось завершить кейс${detail}.`
        } else {
            pageError.value = 'Не удалось завершить кейс. Сервер недоступен.'
        }
        isFinishModalOpen.value = false
    } finally {
        isAbandonPending.value = false
    }
}

/**
 * Reveals patient passport and vitals via the dedicated exam endpoint.
 * The keyword classifier in sendMessage covers free-text requests; this is
 * the explicit-button path.
 */
async function handleRequestExam(): Promise<void> {
    if (isExamPending.value || session.value === null || session.value.examRevealed) return
    isExamPending.value = true
    try {
        const updated = await simulationApi.revealExam(sessionId.value)
        session.value = updated
    } catch {
        pageError.value = 'Не удалось получить данные осмотра. Попробуйте снова.'
    } finally {
        isExamPending.value = false
    }
}

let unsubscribeChunk: (() => void) | null = null

onMounted(async () => {
    if (unsubscribeChunk !== null) unsubscribeChunk()
    unsubscribeChunk = socket.onChunk(handleChunk)

    const raw = route.params.sessionId
    const id = typeof raw === 'string' ? parseInt(raw, 10) : NaN

    if (!Number.isInteger(id) || id <= 0) {
        pageError.value = 'Некорректный ID сессии. Вернитесь к списку кейсов.'
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
    if (unsubscribeChunk !== null) unsubscribeChunk()
    socket.disconnect()
})
</script>

<template>
    <div class="flex h-full flex-1 overflow-hidden">
        <div
            v-if="isLoading"
            class="flex flex-1 items-center justify-center"
        >
            <VSpinner size="lg" />
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
                    @finish="handleOpenFinish"
                    @diagnose="handleOpenDiagnose"
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
                    <VSpinner size="lg" />
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
                    <VSpinner size="lg" />
                    <p class="text-[1.4rem] text-text-secondary">{{ COPY.scoringMessage }}</p>
                </div>

                <template v-else>
                    <ChatTimeline
                        :messages="session.messages"
                        :pending-doctor-message="pendingSentMessage"
                        :streaming-content="streamingContent"
                        :is-streaming-active="activeStreamKind !== null"
                        :patient-name="session.patientName"
                        :exam-revealed="session.examRevealed"
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
