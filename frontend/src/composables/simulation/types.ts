import type {Ref} from 'vue'
import type {
    SimulationSession,
    SimulationSocket,
} from '@/types'

/**
 * Параметры useSimulationSession
 */
export interface UseSimulationSessionParams {
    sessionId: Ref<number>
    socket: SimulationSocket
}

/**
 * Возврат useSimulationSession: реактивное состояние сессии и два метода загрузки —
 * "холодная" fetchSession (со спиннером и редиректом) и "тихая" reloadSession (без спиннера).
 */
export interface UseSimulationSessionReturn {
    session: Ref<SimulationSession | null>
    isLoading: Ref<boolean>
    pageError: Ref<string | null>
    fetchSession: (options?: { retryOpening?: boolean }) => Promise<void>
    reloadSession: () => Promise<void>
}

/**
 * Параметры useSimulationStream: реактивные sessionId/session, общий сокет и два callback,
 * которые composable вызывает на чанках 'done' и 'error' соответственно.
 */
export interface UseSimulationStreamParams {
    sessionId: Ref<number>
    session: Ref<SimulationSession | null>
    socket: SimulationSocket
    /**
     * Callback, вызываемый при штатном завершении стрима (чанк 'done').
     */
    onStreamDone: () => Promise<void> | void
    /**
     * Callback, вызываемый при сбое стрима (чанк 'error').
     */
    onStreamError: () => Promise<void> | void
}
