import { apiGet, apiPost } from '@/composables/useApi'
import type {
    ActiveSimulation,
    SimulationCommandResponse,
    SimulationSession,
} from '@/types'
import { isActiveSimulation } from '@/types'

/**
 * Validates and normalizes a session ID route param into a number.
 * Throws a TypeError if the value cannot be coerced to a valid positive integer.
 */
function toSessionId(raw: number | string): number {
    const parsed = typeof raw === 'number' ? raw : parseInt(raw, 10)

    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new TypeError(`Invalid sessionId: ${String(raw)}`)
    }

    return parsed
}

export interface GetSessionOptions {
    retryOpening?: boolean
}

/**
 * Composable for simulation lifecycle REST endpoints.
 */
export function useSimulationApi() {
    /**
     * Starts a new simulation session for the given case.
     * May throw ApiError with status 409 if an unfinished session already exists.
     */
    async function start(caseId: string): Promise<SimulationCommandResponse> {
        return apiPost<SimulationCommandResponse, { caseId: string }>(
            '/api/simulations/start',
            { caseId },
        )
    }

    /**
     * Returns the currently active (unfinished) simulation, or null if none exists.
     * Backend returns an empty body or no entity for absent sessions; this method
     * normalizes that to null rather than leaking Optional semantics.
     */
    async function active(): Promise<ActiveSimulation | null> {
        const raw = await apiGet<ActiveSimulation | null>('/api/simulations/active')

        if (raw === null || raw === undefined) {
            return null
        }

        return isActiveSimulation(raw) ? raw : null
    }

    /**
     * Fetches full session state by ID.
     * Pass `retryOpening: true` to request server-side opening regeneration.
     */
    async function getSession(
        sessionId: number | string,
        options?: GetSessionOptions,
    ): Promise<SimulationSession> {
        const id = toSessionId(sessionId)
        const params = options?.retryOpening === true
            ? { retryOpening: true }
            : undefined

        return apiGet<SimulationSession>(`/api/simulations/${id}`, { params })
    }

    /**
     * Sends a doctor message in the active session.
     * May throw ApiError with status 409 if AI response is already in flight.
     */
    async function sendMessage(
        sessionId: number | string,
        content: string,
    ): Promise<SimulationCommandResponse> {
        const id = toSessionId(sessionId)

        return apiPost<SimulationCommandResponse, { content: string }>(
            `/api/simulations/${id}/message`,
            { content },
        )
    }

    /**
     * Submits a diagnosis selection and returns the updated session.
     * May throw ApiError with status 409 if the session state does not allow diagnosis.
     */
    async function diagnose(
        sessionId: number | string,
        diagnosis: string,
    ): Promise<SimulationSession> {
        const id = toSessionId(sessionId)

        return apiPost<SimulationSession, { diagnosis: string }>(
            `/api/simulations/${id}/diagnose`,
            { diagnosis },
        )
    }

    return { active, diagnose, getSession, sendMessage, start }
}
