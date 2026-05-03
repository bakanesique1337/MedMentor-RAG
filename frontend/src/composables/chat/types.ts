import type {ComputedRef, Ref} from 'vue'
import type {DiagnosePayload} from '@/composables/api/types'
import type {
    SimulationSession,
    SimulationSocket,
    SimulationStream,
} from '@/types'

/**
 * Параметры useChatActions: внешние зависимости (сессия, стрим, сокет, fetch и
 * close-callback'и модальных окон) пробрасываются явно, чтобы избежать циклических
 * импортов и упростить мокирование в тестах.
 */
export interface UseChatActionsParams {
    sessionId: Ref<number>
    session: Ref<SimulationSession | null>
    pageError: Ref<string | null>
    stream: SimulationStream
    socket: SimulationSocket
    fetchSession: (options?: { retryOpening?: boolean }) => Promise<void>
    closeFinishModal: () => void
    closeDiagnosisModal: () => void
}

/**
 * Возврат useChatActions: pending-флаги для каждого действия,
 * computed-гарды (canSendMessage / canFinishCase / canDiagnose) и непосредственно
 * хендлеры действий врача.
 */
export interface UseChatActionsReturn {
    isSendPending: Ref<boolean>
    isDiagnosisPending: Ref<boolean>
    isAbandonPending: Ref<boolean>
    isExamPending: Ref<boolean>
    conflictMessage: Ref<string | null>

    canSendMessage: ComputedRef<boolean>
    canFinishCase: ComputedRef<boolean>
    canDiagnose: ComputedRef<boolean>

    handleSend: (content: string) => Promise<void>
    handleDiagnose: (payload: DiagnosePayload) => Promise<void>
    handleAbandon: () => Promise<void>
    handleRequestExam: () => Promise<void>
    handleRetryOpening: () => Promise<void>
    handleBack: () => void
}

/**
 * Возврат useChatModals: состояние модальных окон чата (завершение и диагноз)
 * + open/close хендлеры. Вынесено отдельно, чтобы useChatActions мог явно
 * закрывать модальные окна через переданные callback'и, не зная их внутреннего состояния.
 */
export interface UseChatModalsReturn {
    isFinishModalOpen: Ref<boolean>
    isDiagnosisModalOpen: Ref<boolean>
    openFinishModal: () => void
    openDiagnosisModal: () => void
    closeFinishModal: () => void
    closeDiagnosisModal: () => void
}

/**
 * Возврат useInlineExamCard: computed-флаг видимости
 * карточки осмотра в ленте чата.
 */
export interface UseInlineExamCardReturn {
    showInlineExamCard: ComputedRef<boolean>
}
