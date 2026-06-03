import type { ComputedRef, Ref } from 'vue'

import type { CaseCard, DifficultyFilterValue } from '@/types'

/**
 * Возврат useCasesFilter: реактивные фильтры (категория/сложность/поисковая строка)
 * вместе с производными списками и счётчиками. Все коллекции — computed,
 * чтобы пересчёт происходил автоматически при изменении исходного списка кейсов.
 */
export interface UseCasesFilterReturn {
    selectedCategory: Ref<string>
    selectedDifficulty: Ref<DifficultyFilterValue>
    searchQuery: Ref<string>
    orderedCategories: ComputedRef<string[]>
    categoryCounts: ComputedRef<Record<string, number>>
    filteredCases: ComputedRef<CaseCard[]>
    isFiltered: ComputedRef<boolean>
    resetFilters: () => void
}
