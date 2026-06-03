import {ref} from 'vue'

import {useCasesApi} from '@/composables/api/useCasesApi'
import {useProfileApi} from '@/composables/api/useProfileApi'
import {PROFILE_ALERTS_TEXTS} from '@/constants/profileViewTexts'
import {useUserProfileStore} from '@/stores/userProfile'
import type {CaseCard, HistorySession, SimulationStatsOverview, UserSettings} from '@/types'

/**
 * Loads and stores the four data slices required by the profile page in parallel.
 */
export function useProfileData() {
    const profileApi = useProfileApi()
    const casesApi = useCasesApi()
    const userProfile = useUserProfileStore()

    const userSettings = ref<UserSettings | null>(null)
    const stats = ref<SimulationStatsOverview | null>(null)
    const historyList = ref<HistorySession[]>([])
    const casesList = ref<CaseCard[]>([])

    const isLoading = ref(true)
    const loadError = ref<string | null>(null)

    async function fetchProfileData(): Promise<void> {
        isLoading.value = true
        loadError.value = null

        try {
            const [settingsResult, statsResult, historyResult, casesResult] = await Promise.all([
                profileApi.settings(),
                profileApi.stats(),
                profileApi.history(),
                casesApi.getCases(),
            ])

            userSettings.value = settingsResult
            stats.value = statsResult
            historyList.value = historyResult
            casesList.value = casesResult
            userProfile.setSettings(settingsResult)
        } catch {
            loadError.value = PROFILE_ALERTS_TEXTS.loadErrorDescription
        } finally {
            isLoading.value = false
        }
    }

    return {
        userSettings,
        stats,
        historyList,
        casesList,
        isLoading,
        loadError,
        fetchProfileData,
    }
}