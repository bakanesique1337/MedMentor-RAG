<script setup lang="ts">
/**
 * CasesView — страница каталога клинических задач и точка входа в тренажер
 * диалога с виртуальным пациентом.
 *
 * Роль в архитектуре (controller component):
 *  - выполняет HTTP-запросы к REST API (задачи, активная сессия, статистика);
 *  - хранит состояние загрузки и ошибок;
 *  - делегирует логику фильтрации composable useCasesFilter;
 *  - пробрасывает готовые данные в дочерние компоненты
 */

import type {
    ActiveSimulation,
    CaseCard as CaseCardType,
    SimulationStatsOverview,
} from '@/types'

import {computed, onMounted, ref} from 'vue'
import {useRouter} from 'vue-router'
import {useCasesApi} from '@/composables/api/useCasesApi'
import {useProfileApi} from '@/composables/api/useProfileApi'
import {useSimulationApi} from '@/composables/api/useSimulationApi'
import {ALL_CATEGORIES, useCasesFilter} from '@/composables/cases/useCasesFilter'
import {usePluralize} from '@/composables/shared/usePluralize'
import {categoryDisplayLabel} from '@/constants/caseCategories'
import {
    CASES_ALERTS_TEXTS,
    CASES_EMPTY_STATE_TEXTS,
    CASES_FILTERS_TEXTS,
    CASES_HERO_PLURAL_FORMS,
    CASES_HERO_TEXTS,
} from '@/constants/casesViewTexts'
import {HTTP_STATUS_CONFLICT} from '@/constants/http'
import {ROUTES} from '@/constants/routes'
import {isApiError} from '@/utils/typeGuards'

import {VAlert, VButton, VEmptyState, VSkeleton} from '@/components/ui'
import ActiveSessionBanner from '@/components/cases/ActiveSessionBanner.vue'
import CaseCard from '@/components/cases/CaseCard.vue'
import CasesSearchInput from '@/components/cases/CasesSearchInput.vue'
import CasesStatStrip from '@/components/cases/CasesStatStrip.vue'
import CategoryChip from '@/components/cases/CategoryChip.vue'
import DifficultySegmented from '@/components/cases/DifficultySegmented.vue'

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

const {
    selectedCategory,
    selectedDifficulty,
    searchQuery,
    orderedCategories,
    categoryCounts,
    filteredCases,
    isFiltered,
    resetFilters,
} = useCasesFilter(cases)

const startPendingCaseId = ref<string | null>(null)
const pageError = ref<string | null>(null)
const conflictMessage = ref<string | null>(null)

const isLoading = computed(() => isLoadingCases.value || isLoadingActive.value)

const SKELETON_KEYS = Array.from({length: 6}, (_, i) => `skeleton-card-${i}`)

const totalCount = computed<number>(() => cases.value.length)
const completedCount = computed<number>(() => stats.value?.completedSessions ?? 0)
const averageTotalScore = computed<number | null>(() => stats.value?.averageTotalScore ?? null)

const casesNoun = usePluralize(totalCount, CASES_HERO_PLURAL_FORMS.cases)
const specializationsNoun = usePluralize(() => orderedCategories.value.length, CASES_HERO_PLURAL_FORMS.specializations)

/**
 * Загружает полный список доступных клинических задач одним запросом.
 *
 * Фильтрация по категории, сложности и поисковому запросу выполняется на клиенте
 * (см. useCasesFilter), поэтому пагинация и query-параметры здесь не используются:
 * объём каталога в рамках MVP заведомо мал и помещается в одну выдачу.
 */
async function fetchCases(): Promise<void> {
    isLoadingCases.value = true
    pageError.value = null
    try {
        cases.value = await casesApi.getCases()
    } catch {
        pageError.value = CASES_ALERTS_TEXTS.loadCasesError
    } finally {
        isLoadingCases.value = false
    }
}

/**
 * Запрашивает у бэкенда активную (незавершённую) сессию пользователя, если она есть.
 *
 * Ошибка подавляется намеренно: отсутствие активной сессии — нормальное состояние,
 * а сетевой сбой здесь не должен блокировать работу с каталогом.
 * При неудаче баннер ActiveSessionBanner просто не показывается.
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
 * Запрашивает агрегированную статистику пользователя
 * (число завершённых сессий и средний балл) для шапки страницы.
 *
 * Ошибка подавляется: статистика — вспомогательный декоративный элемент,
 * её отсутствие не должно мешать пользователю выбирать кейс и запускать симуляцию.
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
 * Запускает новую симуляцию по выбранному кейсу и переводит пользователя в чат.
 *
 * @param caseId — идентификатор кейса, с которого запускается симуляция
 */
async function handleStart(caseId: string): Promise<void> {
    if (startPendingCaseId.value !== null) return
    startPendingCaseId.value = caseId
    conflictMessage.value = null

    try {
        const response = await simulationApi.start(caseId)
        await router.push({name: ROUTES.CHAT, params: {sessionId: String(response.sessionId)}})
    } catch (err: unknown) {
        if (isApiError(err) && err.status === HTTP_STATUS_CONFLICT) {
            conflictMessage.value = CASES_ALERTS_TEXTS.conflictMessage
            await fetchActiveSession()
        } else {
            pageError.value = CASES_ALERTS_TEXTS.startCaseError
        }
    } finally {
        startPendingCaseId.value = null
    }
}

/**
 * Переход к уже существующей сессии по её идентификатору.
 *
 * @param sessionId — идентификатор сессии, к которой нужно вернуться
 */
async function handleResume(sessionId: number): Promise<void> {
    await router.push({name: ROUTES.CHAT, params: {sessionId: String(sessionId)}})
}

// Параллельная загрузка трёх независимых ресурсов через Promise.all:
// каталог задач, баннер активной сессии и шапка статистики не зависят друг от друга,
onMounted(() => {
    Promise.all([fetchCases(), fetchActiveSession(), fetchStats()])
})
</script>

<template>
    <div class="flex h-full flex-col overflow-hidden">
        <!--
            Sticky-шапка с поисковым полем
        -->
        <header
            class="sticky top-0 z-(--z-sticky) flex shrink-0 items-center gap-[1.6rem] border-b border-(--color-line) bg-white px-[2.8rem] py-[1.4rem]"
        >
            <div class="flex-1"/>
            <CasesSearchInput v-model="searchQuery"/>
        </header>

        <div class="flex-1 overflow-y-auto [scrollbar-gutter:stable]">
            <!-- HERO-секция -->
            <section
                class="border-b border-(--color-line) px-[2.8rem] py-[2.8rem]"
                style="background: linear-gradient(180deg, var(--color-teal-ghost) 0%, var(--color-bg) 100%);"
            >
                <div class="mx-auto w-full max-w-480">
                    <p class="mb-4 font-mono text-[1.1rem] font-semibold uppercase tracking-[0.14em] text-brand">
                        {{ CASES_HERO_TEXTS.catalogPrefix }} &middot; {{ totalCount }} {{ casesNoun }} &middot;
                        {{ orderedCategories.length }} {{ specializationsNoun }}
                    </p>

                    <div class="flex flex-wrap items-end justify-between gap-[2.8rem]">
                        <div class="flex min-w-0 flex-1 basis-2xl flex-col">
                            <h1
                                class="mb-[0.6rem] font-serif text-[3.4rem] font-medium leading-[1.1] tracking-[-0.02em] text-text-primary"
                            >
                                {{ CASES_HERO_TEXTS.titleLead }} <em
                                    class="text-accent-italic"
                                >{{ CASES_HERO_TEXTS.titleAccent }}</em>
                            </h1>
                            <p class="max-w-248 text-[1.35rem] leading-[1.55] text-text-secondary">
                                {{ CASES_HERO_TEXTS.description }}
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

            <div class="mx-auto w-full max-w-480 px-[2.8rem] pb-16 pt-8">
                <!-- Баннер активной сессии -->
                <div
                    v-if="!isLoadingActive && activeSession"
                    class="mb-[1.6rem]"
                >
                    <ActiveSessionBanner
                        :session="activeSession"
                        @resume="handleResume"
                    />
                </div>

                <!-- Предупреждение о конфликте -->
                <div
                    v-if="conflictMessage"
                    class="mb-[1.6rem]"
                >
                    <VAlert
                        status="warning"
                        :title="CASES_ALERTS_TEXTS.conflictTitle"
                        :description="conflictMessage"
                    />
                </div>

                <!-- Общая ошибка страницы -->
                <div
                    v-if="pageError"
                    class="mb-[1.6rem]"
                >
                    <VAlert
                        status="error"
                        :title="CASES_ALERTS_TEXTS.loadErrorTitle"
                        :description="pageError"
                    />
                </div>

                <!-- Skeleton-плейсхолдеры на время загрузки -->
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
                    <!-- Фильтры по категории (медицинской специализации) -->
                    <div class="mb-[1.2rem] flex flex-wrap gap-[0.8rem]">
                        <CategoryChip
                            :label="CASES_FILTERS_TEXTS.allChip"
                            :count="totalCount"
                            :active="selectedCategory === ALL_CATEGORIES"
                            @click="selectedCategory = ALL_CATEGORIES"
                        />

                        <CategoryChip
                            v-for="category in orderedCategories"
                            :key="category"
                            :label="categoryDisplayLabel(category)"
                            :count="categoryCounts[category] || 0"
                            :active="selectedCategory === category"
                            @click="selectedCategory = category"
                        />
                    </div>

                    <!-- Сегментированный фильтр по уровню сложности и счётчик -->
                    <div class="mb-8 flex flex-wrap items-center justify-between gap-[1.2rem]">
                        <DifficultySegmented v-model="selectedDifficulty"/>

                        <p
                            class="font-mono text-[1.1rem] uppercase tracking-[0.06em] text-text-secondary"
                        >
                            {{ CASES_FILTERS_TEXTS.foundLabel }} &middot;
                            <span class="font-semibold text-text-primary tabular">{{ filteredCases.length }}</span>
                            {{ CASES_FILTERS_TEXTS.foundOf }} {{ totalCount }}
                        </p>

                    </div>

                    <!--
                        Два отдельных empty-state: различение важно для UX:
                        в первом случае действие пользователя — кнопка "Сбросить",
                        во втором — никакого действия предложить нельзя.
                    -->
                    <VEmptyState
                        v-if="filteredCases.length === 0 && isFiltered"
                        :title="CASES_EMPTY_STATE_TEXTS.filteredTitle"
                        :description="CASES_EMPTY_STATE_TEXTS.filteredDescription"
                    >
                        <template #action>
                            <VButton
                                variant="secondary"
                                @click="resetFilters"
                            >
                                {{ CASES_FILTERS_TEXTS.resetFiltersButton }}
                            </VButton>
                        </template>
                    </VEmptyState>

                    <VEmptyState
                        v-else-if="cases.length === 0"
                        :title="CASES_EMPTY_STATE_TEXTS.allTitle"
                        :description="CASES_EMPTY_STATE_TEXTS.allDescription"
                    />

                    <!-- Список задач -->
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
