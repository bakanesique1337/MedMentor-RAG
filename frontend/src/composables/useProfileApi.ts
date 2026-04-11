import { apiGet, apiPut } from '@/composables/useApi'
import type {
    HistorySession,
    SimulationSession,
    SimulationStatsOverview,
    UpdateUserSettingsRequest,
    UserSettings,
} from '@/types'
import { mergeSettings } from '@/utils/mergeSettings'

/**
 * Composable for profile, settings, history, and stats REST endpoints.
 */
export function useProfileApi() {
    /**
     * Fetches the current user's settings including display name and preferences map.
     */
    async function settings(): Promise<UserSettings> {
        return apiGet<UserSettings>('/api/settings')
    }

    /**
     * Persists updated settings, merging unknown backend keys to avoid data loss.
     */
    async function updateSettings(payload: UpdateUserSettingsRequest): Promise<UserSettings> {
        const current = await settings()

        const merged: UpdateUserSettingsRequest = {
            displayName: payload.displayName,
            settings: mergeSettings(current.settings, payload.settings),
        }

        return apiPut<UserSettings, UpdateUserSettingsRequest>('/api/settings', merged)
    }

    /**
     * Fetches the list of completed simulation sessions.
     */
    async function history(): Promise<HistorySession[]> {
        return apiGet<HistorySession[]>('/api/history')
    }

    /**
     * Fetches full session detail for a history entry.
     */
    async function historyDetail(sessionId: number | string): Promise<SimulationSession> {
        const id = typeof sessionId === 'number' ? sessionId : parseInt(sessionId, 10)

        return apiGet<SimulationSession>(`/api/history/${id}`)
    }

    /**
     * Fetches the aggregate stats overview for the current user.
     */
    async function stats(): Promise<SimulationStatsOverview> {
        return apiGet<SimulationStatsOverview>('/api/stats/overview')
    }

    return { history, historyDetail, settings, stats, updateSettings }
}
