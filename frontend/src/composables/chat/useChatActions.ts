import type {
    UseChatActionsParams,
    UseChatActionsReturn,
} from './types'
import type {DiagnosePayload} from '@/composables/api/types'
import {computed, ref} from 'vue'
import {useRouter} from 'vue-router'
import {useSimulationApi} from '@/composables/api/useSimulationApi'
import {HTTP_STATUS_CONFLICT} from '@/constants/http'
import {ROUTES} from '@/constants/routes'
import {useSidebarStore} from '@/stores/sidebar'
import {
    OPENING_STATUS,
    SIMULATION_COMMAND_STATUS,
    SIMULATION_STATE,
    STREAMING_STATUS_TYPE,
    type ActiveStreamKind,
    type SimulationCommandStatus,
} from '@/types'
import {isApiError} from '@/utils/typeGuards'
import {CHAT_ACTIONS_MESSAGES} from '@/constants/chatActionsTexts.ts'

/**
 * Действия "врача" в чате: отправка сообщения, запрос осмотра, постановка диагноза,
 * завершение кейса и повтор вступительной реплики.
 *
 * Composable владеет:
 *  - флагами на каждое действие;
 *  - conflictMessage — последним сообщением о конфликте сессии от бэкенда;
 *  - тремя computed-гардами (canSendMessage / canFinishCase / canDiagnose)
 *
 * Зависимости передаются параметрами (DI).
 *
 * Контракт по конфликту сессии:
 *  - в handleSend он означает "пациент ещё отвечает" — показывает подсказку, не дёргает reload;
 *  - в handleDiagnose означает "фаза уже сменилась" — подтягивает актуальное состояние через fetchSession.
 */
export function useChatActions(params: UseChatActionsParams): UseChatActionsReturn {
    const {
        sessionId,
        session,
        pageError,
        stream,
        socket,
        fetchSession,
        closeFinishModal,
        closeDiagnosisModal,
    } = params

    const router = useRouter()
    const api = useSimulationApi()
    const sidebarStore = useSidebarStore()

    const isSendPending = ref(false)
    const isDiagnosisPending = ref(false)
    const isAbandonPending = ref(false)
    const isExamPending = ref(false)
    const conflictMessage = ref<string | null>(null)

    const canSendMessage = computed<boolean>(() =>
        session.value !== null
        && pageError.value === null
        && session.value.openingStatus === OPENING_STATUS.READY
        && session.value.state === SIMULATION_STATE.IN_PROGRESS
        && stream.activeStreamKind.value === null
        && !isSendPending.value,
    )

    const canFinishCase = computed<boolean>(() =>
        session.value !== null
        && session.value.state !== SIMULATION_STATE.COMPLETED
        && session.value.state !== SIMULATION_STATE.ABANDONED
        && session.value.state !== SIMULATION_STATE.SCORING,
    )

    const canDiagnose = computed<boolean>(() =>
        session.value !== null
        && session.value.openingStatus === OPENING_STATUS.READY
        && session.value.state === SIMULATION_STATE.IN_PROGRESS
        && stream.activeStreamKind.value === null,
    )

    /**
     * Маппинг ответа /api/simulations/:id/messages на тип активного стрима.
     * REPLY_STARTED — обычный ответ пациента (PATIENT-сообщение в ленте);
     * FINDING_STARTED — нарратив осмотра (MENTOR-блок);
     * SYSTEM_STARTED — markdown-карточка лабораторки/инструменталки (SYSTEM-сообщение);
     * остальное (OPENING_STARTED, ABANDONED) для /messages некорректны, но
     * на всякий случай отдаём MESSAGE как наиболее безопасный дефолт.
     */
    function resolveStreamKindForStatus(status: SimulationCommandStatus): ActiveStreamKind {
        if (status === SIMULATION_COMMAND_STATUS.FINDING_STARTED) return STREAMING_STATUS_TYPE.FINDING
        if (status === SIMULATION_COMMAND_STATUS.SYSTEM_STARTED) return STREAMING_STATUS_TYPE.SYSTEM
        return STREAMING_STATUS_TYPE.MESSAGE
    }

    /**
     * Отправляет реплику врача и переводит UI в режим ожидания ответа модели.
     * Реплика показывается оптимистично (через stream.pendingSentMessage), чтобы
     * пользователь не ждал бэкенд для появления своего сообщения в ленте.
     *
     * Опциональный {@code narratorPrompt} разделяет «то, что видит пользователь»
     * (content — попадёт в ленту как DOCTOR-сообщение) и «то, что уходит модели»
     * (narratorPrompt — формальная инструкция нарратору). Используется
     * quick-prompt'ами лабораторной/инструментальной диагностики.
     */
    async function handleSend(content: string, narratorPrompt?: string): Promise<void> {
        if (!canSendMessage.value) return

        isSendPending.value = true
        conflictMessage.value = null
        stream.pendingSentMessage.value = content

        try {
            const response = await api.sendMessage(sessionId.value, content, narratorPrompt)
            const kind = resolveStreamKindForStatus(response.status)
            stream.beginStream(kind)
            isSendPending.value = false
        } catch (err: unknown) {
            isSendPending.value = false
            stream.pendingSentMessage.value = null

            if (isApiError(err) && err.status === HTTP_STATUS_CONFLICT) {
                conflictMessage.value = CHAT_ACTIONS_MESSAGES.patientStillReplying
            } else {
                pageError.value = CHAT_ACTIONS_MESSAGES.sendMessageError
            }
        }
    }

    /**
     * Отправляет финальный диагноз пользователя.
     * При успехе обновляет session в-моменте (модальное окно подхватывает новое состояние)
     * и при необходимости сразу уводит на страницу результата.
     */
    async function handleDiagnose(payload: DiagnosePayload): Promise<void> {
        if (isDiagnosisPending.value) return

        isDiagnosisPending.value = true
        conflictMessage.value = null

        try {
            const updated = await api.diagnose(sessionId.value, payload)
            session.value = updated
            isDiagnosisPending.value = false
            closeDiagnosisModal()
            if (updated.state === SIMULATION_STATE.COMPLETED || updated.state === SIMULATION_STATE.ABANDONED) {
                socket.disconnect()
                await router.push({
                    name: ROUTES.RESULT,
                    params: {sessionId: String(sessionId.value)},
                })
            }
        } catch (err: unknown) {
            if (isApiError(err) && err.status === HTTP_STATUS_CONFLICT) {
                conflictMessage.value = CHAT_ACTIONS_MESSAGES.diagnosisStageConflict
                await fetchSession()
                isDiagnosisPending.value = false
                closeDiagnosisModal()
                return
            }
            pageError.value = CHAT_ACTIONS_MESSAGES.diagnosisError
            isDiagnosisPending.value = false
        }
    }

    /**
     * Прекращает текущую симуляцию и возвращает на список кейсов.
     */
    async function handleAbandon(): Promise<void> {
        if (isAbandonPending.value) return
        isAbandonPending.value = true
        try {
            await api.abandon(sessionId.value)
            socket.disconnect()
            sidebarStore.clearActiveSession()
            closeFinishModal()
            await router.push({name: ROUTES.CASES})
        } catch (err: unknown) {
            if (isApiError(err)) {
                const detail = err.error ? ` (${err.status}: ${err.error})` : ` (${err.status})`
                pageError.value = `${CHAT_ACTIONS_MESSAGES.abandonErrorPrefix}${detail}.`
            } else {
                pageError.value = CHAT_ACTIONS_MESSAGES.abandonNetworkError
            }
            closeFinishModal()
        } finally {
            isAbandonPending.value = false
        }
    }

    /**
     * Раскрывает паспорт и витальные показатели через явный REST-эндпоинт.
     * Если передан {@code content} — он будет сохранён бэкендом как DOCTOR-реплика
     * перед SYSTEM-карточкой (используется quick-prompt'ом «Провести осмотр»);
     * на время запроса показывается оптимистично через pendingSentMessage.
     * Если {@code content} нет — это побочная кнопка из сайдбара, в этом случае
     * вызов идемпотентен (после первого раскрытия повторный клик подавляется).
     *
     * Никакого стрима ответа пациента этот хендлер не запускает: это «системное
     * действие», результат — только карточка в ленте.
     */
    async function handleRequestExam(content?: string): Promise<void> {
        if (isExamPending.value || session.value === null) return
        // Идемпотентный путь для сайдбара: повторный клик без content — no-op.
        if (content === undefined && session.value.examRevealed) return

        isExamPending.value = true
        if (content !== undefined) {
            stream.pendingSentMessage.value = content
        }
        try {
            session.value = await api.revealExam(sessionId.value, content)
        } catch {
            pageError.value = CHAT_ACTIONS_MESSAGES.examError
        } finally {
            isExamPending.value = false
            stream.pendingSentMessage.value = null
        }
    }

    /**
     * Перезапускает генерацию вступительной реплики после OPENING_FAILED.
     * Перед попыткой закрывает соединение и сбрасывает стрим-буферы, чтобы старая
     * подписка не получила чанки от новой попытки.
     */
    async function handleRetryOpening(): Promise<void> {
        socket.disconnect()
        stream.resetBuffers()
        stream.streamErrorMessage.value = null
        await fetchSession({retryOpening: true})
    }

    /**
     * Навигация на список задач.
     */
    function handleBack(): void {
        router.push({name: ROUTES.CASES}).catch(() => undefined)
    }

    return {
        isSendPending,
        isDiagnosisPending,
        isAbandonPending,
        isExamPending,
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
    }
}
