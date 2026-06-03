import {computed, ref, toValue, type MaybeRefOrGetter} from 'vue'
import {ALL_DIFFICULTIES, type CaseCard, type DifficultyFilterValue} from '@/types'
import type {UseCasesFilterReturn} from './types'

/**
 * Sentinel-значение для фильтра категорий, обозначающее режим "показать все
 * категории". Обрамление подчёркиваниями (`__all__`) исключает
 * коллизию с реальными значениями `CaseCard.category`, которые приходят
 * с бэкенда в виде идентификаторов вроде `cardiology` или `infections`.
 */
export const ALL_CATEGORIES = '__all__'

/**
 * Composable клиентской фильтрации списка клинических задач.
 *
 * Инкапсулирует три независимых критерия отбора — категорию, уровень
 * сложности и свободную текстовую строку поиска — и предоставляет
 * наружу как реактивное состояние самих фильтров, так и производные
 * коллекции: отфильтрованный список, перечень доступных категорий
 * и счётчики задач по категориям.
 *
 * Фильтрация выполняется на клиенте: общее число учебных задач
 * ограничено (десятки записей), серверная пагинация и серверный
 * полнотекстовый поиск в данном сценарии избыточны.
 *
 * @param cases - реактивный источник списка задач для фильтрации
 * @returns UseCasesFilterReturn
 */
export function useCasesFilter(cases: MaybeRefOrGetter<CaseCard[]>): UseCasesFilterReturn {
    /**
     * Текущая выбранная категория.
     */
    const selectedCategory = ref<string>(ALL_CATEGORIES)

    /**
     * Текущий выбранный уровень сложности.
     */
    const selectedDifficulty = ref<DifficultyFilterValue>(ALL_DIFFICULTIES)

    /**
     * Сырая строка поискового запроса. Триммирование и приведение к нижнему регистру
     * выполняются непосредственно в `filteredCases`, чтобы не мутировать
     * исходное значение и сохранить точное отображение в input-поле.
     */
    const searchQuery = ref('')

    /**
     * Список уникальных категорий в порядке их первого появления в
     * исходном массиве задач.
     */
    const orderedCategories = computed<string[]>(() => {
        const seen = new Set<string>()
        const out: string[] = []
        for (const item of toValue(cases)) {
            if (!seen.has(item.category)) {
                seen.add(item.category)
                out.push(item.category)
            }
        }
        return out
    })

    /**
     * Количество задач в каждой категории.
     */
    const categoryCounts = computed<Record<string, number>>(() => {
        const counts: Record<string, number> = {}
        for (const item of toValue(cases)) {
            counts[item.category] = (counts[item.category] || 0) + 1
        }
        return counts
    })

    /**
     * Список задач, удовлетворяющих текущему сочетанию фильтров.
     *
     * Все три критерия применяются конъюнктивно: кейс попадает в
     * результат, только если одновременно совпали категория, уровень
     * сложности и найдено вхождение поискового запроса хотя бы в одно
     * из текстовых полей (`title`, `patientName`, `patientBrief`).
     *
     * Поиск выполняется без учёта регистра.
     */
    const filteredCases = computed<CaseCard[]>(() => {
        const query = searchQuery.value.trim().toLowerCase()
        return toValue(cases).filter((item) => {
            const matchesCategory = selectedCategory.value === ALL_CATEGORIES
                || item.category === selectedCategory.value
            const matchesDifficulty = selectedDifficulty.value === ALL_DIFFICULTIES
                || item.difficulty === selectedDifficulty.value
            const matchesQuery = query === ''
                || item.title.toLowerCase().includes(query)
                || item.patientName.toLowerCase().includes(query)
                || item.patientBrief.toLowerCase().includes(query)
                || item.tags.some((tag) => tag.toLowerCase().includes(query))
            return matchesCategory && matchesDifficulty && matchesQuery
        })
    })

    /**
     * Признак того, что хотя бы один из фильтров отличается от значения
     * по умолчанию.
     */
    const isFiltered = computed<boolean>(
        () => selectedCategory.value !== ALL_CATEGORIES
            || selectedDifficulty.value !== ALL_DIFFICULTIES
            || searchQuery.value.trim() !== '',
    )

    /**
     * Возвращает все три фильтра к значениям по умолчанию.
     */
    function resetFilters(): void {
        selectedCategory.value = ALL_CATEGORIES
        selectedDifficulty.value = ALL_DIFFICULTIES
        searchQuery.value = ''
    }

    return {
        selectedCategory,
        selectedDifficulty,
        searchQuery,
        orderedCategories,
        categoryCounts,
        filteredCases,
        isFiltered,
        resetFilters,
    }
}
