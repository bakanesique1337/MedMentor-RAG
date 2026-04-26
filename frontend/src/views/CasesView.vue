<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import ActiveSessionBanner from '@/components/cases/ActiveSessionBanner.vue'
import CaseCard from '@/components/cases/CaseCard.vue'
import CasesSearchInput from '@/components/cases/CasesSearchInput.vue'
import CasesStatStrip from '@/components/cases/CasesStatStrip.vue'
import CategoryChip from '@/components/cases/CategoryChip.vue'
import DifficultySegmented from '@/components/cases/DifficultySegmented.vue'
import type { DifficultyFilterValue } from '@/components/cases/DifficultySegmented.vue'
import { VAlert, VButton, VEmptyState, VSkeleton } from '@/components/ui'
import { useCasesApi } from '@/composables/useCasesApi'
import { useProfileApi } from '@/composables/useProfileApi'
import { useSimulationApi } from '@/composables/useSimulationApi'
import { categoryDisplayLabel } from '@/constants/caseCategories'
import { ROUTES } from '@/constants/routes'
import type {
    ActiveSimulation,
    CaseCard as CaseCardType,
    SimulationStatsOverview,
} from '@/types'
import { isApiError } from '@/types'

const COPY = {
    breadcrumbAriaLabel: 'Хлебные крошки',
    breadcrumbLibrary: 'Библиотека',
    breadcrumbCatalog: 'Каталог кейсов',
    catalogPrefix: 'Каталог',
    casesNoun: 'кейсов',
    specializationsNoun: 'специализаций',
    titleLead: 'Клинические',
    titleAccent: 'задачи',
    description: 'Симулируемые пациенты по ключевым специализациям. Выберите категорию и уровень сложности, чтобы потренировать сбор анамнеза, дифференциальную диагностику и коммуникацию.',
    conflictAlertTitle: 'Конфликт сессии',
    loadErrorAlertTitle: 'Ошибка загрузки',
    allChip: 'Все',
    foundLabel: 'Найдено',
    foundOf: 'из',
    emptyFilteredTitle: 'Ничего не нашлось',
    emptyFilteredDescription: 'Попробуйте сбросить фильтры или изменить запрос.',
    resetFiltersButton: 'Сбросить фильтры',
    emptyAllTitle: 'Пока нет кейсов',
    emptyAllDescription: 'Загляните позже — библиотека постоянно пополняется.',
} as const

const ALL_CATEGORIES = '__all__'

const router = useRouter()
const casesApi = useCasesApi()
const simulationApi = useSimulationApi()
const profileApi = useProfileApi()

const cases = ref<CaseCardType[]>([])
const activeSession = ref<ActiveSimulation | null>(null)
const stats = ref<SimulationStatsOverview | null>(null)

const isLoadingCases = ref(true)
const isLoadingActive = ref(true)
const isLoadingStats = ref(true)

const selectedCategory = ref<string>(ALL_CATEGORIES)
const selectedDifficulty = ref<DifficultyFilterValue>('all')
const searchQuery = ref('')

const startPendingCaseId = ref<string | null>(null)
const pageError = ref<string | null>(null)
const conflictMessage = ref<string | null>(null)

const isLoading = computed(() => isLoadingCases.value || isLoadingActive.value)

const SKELETON_KEYS = Array.from({ length: 6 }, (_, i) => `skeleton-card-${i}`)

const orderedCategories = computed<string[]>(() => {
    const seen = new Set<string>()
    const out: string[] = []
    for (const item of cases.value) {
        if (!seen.has(item.category)) {
            seen.add(item.category)
            out.push(item.category)
        }
    }
    return out
})

const categoryCounts = computed<Record<string, number>>(() => {
    const counts: Record<string, number> = {}
    for (const item of cases.value) {
        counts[item.category] = (counts[item.category] ?? 0) + 1
    }
    return counts
})

const filteredCases = computed<CaseCardType[]>(() => {
    const query = searchQuery.value.trim().toLowerCase()
    return cases.value.filter((item) => {
        const matchesCategory = selectedCategory.value === ALL_CATEGORIES
            || item.category === selectedCategory.value
        const matchesDifficulty = selectedDifficulty.value === 'all'
            || item.difficulty.toLowerCase() === selectedDifficulty.value
        const matchesQuery = query === ''
            || item.title.toLowerCase().includes(query)
            || item.patientName.toLowerCase().includes(query)
            || item.patientBrief.toLowerCase().includes(query)
            || item.tags.some((tag) => tag.toLowerCase().includes(query))
        return matchesCategory && matchesDifficulty && matchesQuery
    })
})

const isFiltered = computed(
    () => selectedCategory.value !== ALL_CATEGORIES
        || selectedDifficulty.value !== 'all'
        || searchQuery.value.trim() !== '',
)

const totalCount = computed<number>(() => cases.value.length)
const completedCount = computed<number>(() => stats.value?.completedSessions ?? 0)
const averageTotalScore = computed<number | null>(() => stats.value?.averageTotalScore ?? null)

/**
 * Fetches the full case list.
 */
async function fetchCases(): Promise<void> {
    isLoadingCases.value = true
    pageError.value = null
    try {
        cases.value = await casesApi.getCases()
    } catch {
        pageError.value = 'Не удалось загрузить список кейсов. Попробуйте обновить страницу.'
    } finally {
        isLoadingCases.value = false
    }
}

/**
 * Fetches the currently active session; silently ignores failures.
 */
async function fetchActiveSession(): Promise<void> {
    isLoadingActive.value = true
    try {
        activeSession.value = await simulationApi.active()
    } catch {
        activeSession.value = null
    } finally {
        isLoadingActive.value = false
    }
}

/**
 * Fetches the aggregate stats overview to feed the hero stat strip; silently ignores failures.
 */
async function fetchStats(): Promise<void> {
    isLoadingStats.value = true
    try {
        stats.value = await profileApi.stats()
    } catch {
        stats.value = null
    } finally {
        isLoadingStats.value = false
    }
}

/**
 * Starts a new simulation and navigates to chat; handles 409 conflicts.
 */
async function handleStart(caseId: string): Promise<void> {
    if (startPendingCaseId.value !== null) return
    startPendingCaseId.value = caseId
    conflictMessage.value = null

    try {
        const response = await simulationApi.start(caseId)
        await router.push({ name: ROUTES.CHAT, params: { sessionId: String(response.sessionId) } })
    } catch (err: unknown) {
        if (isApiError(err) && err.status === 409) {
            conflictMessage.value = 'У вас уже есть активная симуляция. Продолжите её из баннера выше.'
            await fetchActiveSession()
        } else {
            pageError.value = 'Не удалось начать кейс. Попробуйте снова.'
        }
    } finally {
        startPendingCaseId.value = null
    }
}

/**
 * Navigates to an existing session.
 */
async function handleResume(sessionId: number): Promise<void> {
    await router.push({ name: ROUTES.CHAT, params: { sessionId: String(sessionId) } })
}

/**
 * Resets all filter state to its initial value.
 */
function handleResetFilters(): void {
    selectedCategory.value = ALL_CATEGORIES
    selectedDifficulty.value = 'all'
    searchQuery.value = ''
}

/**
 * Selects a category chip; passing the all-sentinel clears the category filter.
 */
function handleCategorySelect(category: string): void {
    selectedCategory.value = category
}

onMounted(() => {
    Promise.all([fetchCases(), fetchActiveSession(), fetchStats()])
})
</script>

<template>
    <div class="flex h-full flex-col overflow-hidden">
        <header
            class="sticky top-0 z-[var(--z-sticky)] flex shrink-0 items-center gap-[1.6rem] border-b border-[color:var(--color-line)] bg-white px-[2.8rem] py-[1.4rem]"
        >
            <nav
                class="flex items-center gap-[0.6rem] font-mono text-[1.05rem] uppercase tracking-[0.06em] text-text-secondary"
                :aria-label="COPY.breadcrumbAriaLabel"
            >
                <span class="text-text-tertiary">{{ COPY.breadcrumbLibrary }}</span>
                <span class="text-[color:var(--color-line-2)]">/</span>
                <span class="font-medium text-text-primary">{{ COPY.breadcrumbCatalog }}</span>
            </nav>
            <div class="flex-1" />
            <CasesSearchInput v-model="searchQuery" />
        </header>

        <div class="flex-1 overflow-y-auto">
            <section
                class="border-b border-[color:var(--color-line)] px-[2.8rem] py-[2.8rem]"
                style="background: linear-gradient(180deg, var(--color-teal-ghost) 0%, var(--color-bg) 100%);"
            >
                <div class="mx-auto w-full max-w-[120rem]">
                    <p class="mb-[1rem] font-mono text-[1.1rem] font-semibold uppercase tracking-[0.14em] text-brand">
                        {{ COPY.catalogPrefix }} &middot; {{ totalCount }} {{ COPY.casesNoun }} &middot; {{ orderedCategories.length }} {{ COPY.specializationsNoun }}
                    </p>
                    <div class="flex flex-wrap items-end justify-between gap-[2.8rem]">
                        <div class="flex min-w-0 flex-1 basis-[42rem] flex-col">
                            <h1
                                class="mb-[0.6rem] font-serif text-[3.4rem] font-medium leading-[1.1] tracking-[-0.02em] text-text-primary"
                            >
                                {{ COPY.titleLead }} <em class="text-accent-italic">{{ COPY.titleAccent }}</em>
                            </h1>
                            <p class="max-w-[62rem] text-[1.35rem] leading-[1.55] text-text-secondary">
                                {{ COPY.description }}
                            </p>
                        </div>
                        <CasesStatStrip
                            :completed-count="completedCount"
                            :total-count="totalCount"
                            :average-total-score="averageTotalScore"
                        />
                    </div>
                </div>
            </section>

            <div class="mx-auto w-full max-w-[120rem] px-[2.8rem] pb-[4rem] pt-[2rem]">
                <div
                    v-if="!isLoadingActive && activeSession"
                    class="mb-[1.6rem]"
                >
                    <ActiveSessionBanner
                        :session="activeSession"
                        @resume="handleResume"
                    />
                </div>

                <div
                    v-if="conflictMessage"
                    class="mb-[1.6rem]"
                >
                    <VAlert
                        status="warning"
                        :title="COPY.conflictAlertTitle"
                        :description="conflictMessage"
                    />
                </div>

                <div
                    v-if="pageError"
                    class="mb-[1.6rem]"
                >
                    <VAlert
                        status="error"
                        :title="COPY.loadErrorAlertTitle"
                        :description="pageError"
                    />
                </div>

                <div
                    v-if="isLoading"
                    class="flex flex-col gap-[1.6rem]"
                >
                    <div class="flex flex-wrap gap-[0.8rem]">
                        <VSkeleton
                            v-for="key in ['skeleton-chip-0', 'skeleton-chip-1', 'skeleton-chip-2', 'skeleton-chip-3', 'skeleton-chip-4']"
                            :key="key"
                            width="12rem"
                            height="3.4rem"
                        />
                    </div>
                    <VSkeleton
                        width="36rem"
                        height="3.4rem"
                    />
                    <div class="grid gap-[1.6rem] sm:grid-cols-2 lg:grid-cols-3">
                        <VSkeleton
                            v-for="key in SKELETON_KEYS"
                            :key="key"
                            height="22rem"
                        />
                    </div>
                </div>

                <template v-else-if="!pageError">
                    <div class="mb-[1.2rem] flex flex-wrap gap-[0.8rem]">
                        <CategoryChip
                            :label="COPY.allChip"
                            :count="totalCount"
                            :active="selectedCategory === ALL_CATEGORIES"
                            @click="handleCategorySelect(ALL_CATEGORIES)"
                        />
                        <CategoryChip
                            v-for="category in orderedCategories"
                            :key="category"
                            :label="categoryDisplayLabel(category)"
                            :count="categoryCounts[category] ?? 0"
                            :active="selectedCategory === category"
                            @click="handleCategorySelect(category)"
                        />
                    </div>

                    <div class="mb-[2rem] flex flex-wrap items-center justify-between gap-[1.2rem]">
                        <DifficultySegmented v-model="selectedDifficulty" />
                        <p
                            class="font-mono text-[1.1rem] uppercase tracking-[0.06em] text-text-secondary"
                        >
                            {{ COPY.foundLabel }} &middot;
                            <span class="font-semibold text-text-primary tabular">{{ filteredCases.length }}</span>
                            {{ COPY.foundOf }} {{ totalCount }}
                        </p>
                    </div>

                    <VEmptyState
                        v-if="filteredCases.length === 0 && isFiltered"
                        :title="COPY.emptyFilteredTitle"
                        :description="COPY.emptyFilteredDescription"
                    >
                        <template #action>
                            <VButton
                                variant="secondary"
                                @click="handleResetFilters"
                            >
                                {{ COPY.resetFiltersButton }}
                            </VButton>
                        </template>
                    </VEmptyState>

                    <VEmptyState
                        v-else-if="cases.length === 0"
                        :title="COPY.emptyAllTitle"
                        :description="COPY.emptyAllDescription"
                    />

                    <div
                        v-else
                        class="grid gap-[1.6rem] sm:grid-cols-2 lg:grid-cols-3"
                    >
                        <CaseCard
                            v-for="caseData in filteredCases"
                            :key="caseData.id"
                            :case-data="caseData"
                            :is-active="activeSession !== null && activeSession.caseId === caseData.id"
                            :active-session-id="activeSession !== null ? activeSession.id : null"
                            :is-start-pending="startPendingCaseId === caseData.id"
                            @start="handleStart"
                            @resume="handleResume"
                        />
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>
