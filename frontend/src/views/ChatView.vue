<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ChatInputBar from '@/components/chat/ChatInputBar.vue'
import ChatSidebar from '@/components/chat/ChatSidebar.vue'
import ChatTimeline from '@/components/chat/ChatTimeline.vue'
import ChatTopBar from '@/components/chat/ChatTopBar.vue'
import DiagnosisPanel from '@/components/chat/DiagnosisPanel.vue'
import SessionScoreCard from '@/components/chat/SessionScoreCard.vue'
import { VAlert, VButton, VSpinner } from '@/components/ui'
import { ROUTES } from '@/constants/routes'
import { SIMULATION_QUICK_PROMPTS } from '@/constants/simulationQuickPrompts'
import { useSimulationApi } from '@/composables/useSimulationApi'
import { useSimulationSocket } from '@/composables/useSimulationSocket'
import type { SimulationSession, StreamChunk } from '@/types'
import { isApiError } from '@/types'

const route = useRoute()
const router = useRouter()
const simulationApi = useSimulationApi()
const socket = useSimulationSocket()

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
const conflictMessage = ref<string | null>(null)

const isOpeningPending = computed(() =>
    session.value?.openingStatus === 'OPENING_PENDING'
    || session.value?.openingStatus === 'OPENING_STREAMING',
)
const isOpeningFailed = computed(() => session.value?.openingStatus === 'OPENING_FAILED')
const isDiagnosisPhase = computed(() => session.value?.state === 'DIAGNOSIS_SELECT')
const isScoringPhase = computed(() => session.value?.state === 'SCORING')
const isCompleted = computed(() => session.value?.state === 'COMPLETED')

const canSendMessage = computed(() =>
    session.value !== null
    && pageError.value === null
    && session.value.openingStatus === 'OPENING_READY'
    && session.value.state === 'IN_PROGRESS'
    && activeStreamKind.value === null
    && !isSendPending.value,
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

        const streamKind = resolveStreamKind(data)
        activeStreamKind.value = streamKind
        streamErrorMessage.value = null

        if (data.state !== 'COMPLETED') {
            socket.connect(sessionId.value)
        }
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
async function handleDiagnose(diagnosis: string): Promise<void> {
    if (isDiagnosisPending.value) return

    isDiagnosisPending.value = true
    conflictMessage.value = null

    try {
        const updated = await simulationApi.diagnose(sessionId.value, diagnosis)
        session.value = updated
        isDiagnosisPending.value = false
    } catch (err: unknown) {
        if (isApiError(err) && err.status === 409) {
            conflictMessage.value = 'Диагноз нельзя отправить на этом этапе. Перезагружаем состояние…'
            await fetchSession()
            isDiagnosisPending.value = false
            return
        }
        pageError.value = 'Не удалось отправить диагноз. Попробуйте снова.'
        isDiagnosisPending.value = false
    }
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
    await fetchSession()
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
                title="Сессия недоступна"
                :description="pageError"
            />
            <div>
                <VButton
                    variant="secondary"
                    @click="handleBack"
                >
                    К списку кейсов
                </VButton>
            </div>
        </div>

        <template v-else-if="session">
            <ChatSidebar
                :session="session"
                :session-id="sessionId"
                class="hidden lg:flex"
            />

            <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
                <ChatTopBar
                    :session="session"
                    :session-id="sessionId"
                    @back="handleBack"
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
                        Пациент готовит вступление…
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
                        title="Опенинг не удался"
                        description="Вступление пациента не удалось сгенерировать."
                    />
                    <div class="flex gap-[1.2rem]">
                        <VButton @click="handleRetryOpening">Повторить</VButton>
                        <VButton
                            variant="ghost"
                            @click="handleBack"
                        >
                            К списку кейсов
                        </VButton>
                    </div>
                </div>

                <div
                    v-else-if="isScoringPhase"
                    class="flex flex-1 flex-col items-center justify-center gap-[1.2rem]"
                >
                    <VSpinner size="lg" />
                    <p class="text-[1.4rem] text-text-secondary">Модель оценивает вашу сессию…</p>
                </div>

                <div
                    v-else-if="isCompleted"
                    class="flex flex-1 flex-col overflow-y-auto"
                >
                    <ChatTimeline
                        :messages="session.messages"
                        :patient-name="session.patientName"
                        streaming-content=""
                        :is-streaming-active="false"
                    />
                    <div class="shrink-0 border-t border-[color:var(--color-line)] bg-surface-base px-[2.4rem] py-[2.4rem]">
                        <div class="mx-auto w-full max-w-[84rem]">
                            <SessionScoreCard
                                :score="session.score"
                                :result="session.result"
                                :case-title="session.caseTitle"
                            />
                            <div class="mt-[1.6rem]">
                                <VButton
                                    variant="secondary"
                                    @click="handleBack"
                                >
                                    К списку кейсов
                                </VButton>
                            </div>
                        </div>
                    </div>
                </div>

                <template v-else>
                    <ChatTimeline
                        :messages="session.messages"
                        :pending-doctor-message="pendingSentMessage"
                        :streaming-content="streamingContent"
                        :is-streaming-active="activeStreamKind !== null"
                        :patient-name="session.patientName"
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
                    />
                </template>
            </div>
        </template>
    </div>
</template>
