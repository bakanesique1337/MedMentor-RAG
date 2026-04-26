import { defineStore } from 'pinia'
import { ref } from 'vue'

import { useCasesApi } from '@/composables/useCasesApi'
import { useSimulationApi } from '@/composables/useSimulationApi'
import type { ActiveSimulation } from '@/types'

/**
 * Cross-route shared state for the global sidebar.
 *
 * The sidebar persists across CasesView and ProfileView, so it needs a
 * coherent view of the cases count and the currently active simulation
 * regardless of which page mounted first.
 */
export const useSidebarStore = defineStore('sidebar', () => {
    const casesCount = ref<number | null>(null)
    const activeSession = ref<ActiveSimulation | null>(null)

    const isCasesCountPending = ref(false)
    const isActiveSessionPending = ref(false)

    /**
     * Fetches the total number of available cases.
     * Failures are swallowed; the badge simply hides.
     */
    async function fetchCasesCount(): Promise<void> {
        if (isCasesCountPending.value) return
        isCasesCountPending.value = true
        try {
            const cases = await useCasesApi().getCases()
            casesCount.value = cases.length
        } catch {
            casesCount.value = null
        } finally {
            isCasesCountPending.value = false
        }
    }

    /**
     * Fetches the currently active simulation, or clears it if none exists.
     */
    async function fetchActiveSession(): Promise<void> {
        if (isActiveSessionPending.value) return
        isActiveSessionPending.value = true
        try {
            activeSession.value = await useSimulationApi().active()
        } catch {
            activeSession.value = null
        } finally {
            isActiveSessionPending.value = false
        }
    }

    /**
     * Manually clears the cached active session, e.g. after the user
     * abandons a session and we want the sidebar entry to disappear immediately.
     */
    function clearActiveSession(): void {
        activeSession.value = null
    }

    /**
     * Replaces the cached active session, e.g. when CasesView has just
     * fetched a fresh value and wants the sidebar to reflect it without
     * an extra round trip.
     */
    function setActiveSession(value: ActiveSimulation | null): void {
        activeSession.value = value
    }

    return {
        casesCount,
        activeSession,
        isCasesCountPending,
        isActiveSessionPending,

        fetchCasesCount,
        fetchActiveSession,
        clearActiveSession,
        setActiveSession,
    }
})
