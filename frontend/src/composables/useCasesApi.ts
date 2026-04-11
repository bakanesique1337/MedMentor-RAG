import { apiGet } from '@/composables/useApi'
import type { CaseCard } from '@/types'

/**
 * Composable for case list REST endpoints.
 * Client-side filtering is intentional per P4 plan — no query params added here.
 */
export function useCasesApi() {
    /**
     * Fetches the full list of available case cards.
     */
    async function getCases(): Promise<CaseCard[]> {
        return apiGet<CaseCard[]>('/api/cases')
    }

    return { getCases }
}
