<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import ActiveSessionBanner from '@/components/cases/ActiveSessionBanner.vue'
import CaseCard from '@/components/cases/CaseCard.vue'
import CasesFilters from '@/components/cases/CasesFilters.vue'
import { VAlert, VButton, VEmptyState, VSkeleton } from '@/components/ui'
import { useCasesApi } from '@/composables/useCasesApi'
import { useSimulationApi } from '@/composables/useSimulationApi'
import { ROUTES } from '@/constants/routes'
import type { ActiveSimulation, CaseCard as CaseCardType } from '@/types'
import { isApiError } from '@/types'

const router = useRouter()
const casesApi = useCasesApi()
const simulationApi = useSimulationApi()

const cases = ref<CaseCardType[]>([])
const activeSession = ref<ActiveSimulation | null>(null)

const isLoadingCases = ref(true)
const isLoadingActive = ref(true)

const selectedCategory = ref('')
const selectedDifficulty = ref('')
const searchQuery = ref('')

const startPendingCaseId = ref<string | null>(null)
const pageError = ref<string | null>(null)
const conflictMessage = ref<string | null>(null)

const isLoading = computed(() => isLoadingCases.value || isLoadingActive.value)

const SKELETON_KEYS = Array.from({ length: 6 }, (_, i) => `skeleton-card-${i}`)

const categories = computed<string[]>(() =>
    Array.from(new Set(cases.value.map((c) => c.category))),
)

const difficulties = computed<string[]>(() =>
    Array.from(new Set(cases.value.map((c) => c.difficulty))),
)

const filteredCases = computed<CaseCardType[]>(() => {
    const q = searchQuery.value.trim().toLowerCase()
    return cases.value.filter((c) => {
        const matchesCategory = selectedCategory.value === '' || c.category === selectedCategory.value
        const matchesDifficulty = selectedDifficulty.value === '' || c.difficulty === selectedDifficulty.value
        const matchesQuery = q === ''
            || c.title.toLowerCase().includes(q)
            || c.patientName.toLowerCase().includes(q)
            || c.patientBrief.toLowerCase().includes(q)
        return matchesCategory && matchesDifficulty && matchesQuery
    })
})

const isFiltered = computed(
    () => selectedCategory.value !== '' || selectedDifficulty.value !== '' || searchQuery.value.trim() !== '',
)

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

function handleResetFilters(): void {
    selectedCategory.value = ''
    selectedDifficulty.value = ''
    searchQuery.value = ''
}

onMounted(() => {
    Promise.all([fetchCases(), fetchActiveSession()])
})
</script>

<template>
    <div class="flex h-full flex-col overflow-hidden">
        <!-- Top bar -->
        <header class="flex shrink-0 items-center gap-[1.2rem] border-b border-[color:var(--color-line)] bg-surface-base px-[2.4rem] py-[1.6rem]">
            <nav
                class="flex items-center gap-[0.8rem] text-[1.2rem] text-text-secondary"
                aria-label="Breadcrumbs"
            >
                <span>MedMentor</span>
                <svg
                    width="8"
                    height="8"
                    viewBox="0 0 8 8"
                    class="opacity-50"
                ><path
                    d="M3 2l3 2-3 2"
                    stroke="currentColor"
                    stroke-width="1.2"
                    fill="none"
                /></svg>
                <span class="font-medium text-text-primary">Библиотека кейсов</span>
            </nav>
        </header>

        <div class="flex-1 overflow-y-auto">
            <div class="mx-auto w-full max-w-[132rem] px-[2.4rem] py-[2.4rem]">
                <div class="mb-[2.4rem]">
                    <p class="mb-[0.8rem] text-eyebrow text-brand">Библиотека</p>
                    <h1 class="font-serif text-[3.6rem] font-medium leading-[1.1] tracking-[-0.02em] text-text-primary">
                        Клинические кейсы
                    </h1>
                    <p class="mt-[0.6rem] text-[1.45rem] text-text-secondary">
                        Выберите кейс, чтобы начать симуляцию.
                    </p>
                </div>

                <div
                    v-if="!isLoadingActive && activeSession"
                    class="mb-[2rem]"
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
                        title="Конфликт сессии"
                        :description="conflictMessage"
                    />
                </div>

                <div
                    v-if="pageError"
                    class="mb-[1.6rem]"
                >
                    <VAlert
                        status="error"
                        title="Ошибка загрузки"
                        :description="pageError"
                    />
                </div>

                <div
                    v-if="isLoading"
                    class="flex flex-col gap-[1.6rem]"
                >
                    <div class="flex gap-[1.2rem]">
                        <VSkeleton
                            width="28rem"
                            height="4rem"
                        />
                        <VSkeleton
                            width="18rem"
                            height="4rem"
                        />
                        <VSkeleton
                            width="18rem"
                            height="4rem"
                        />
                    </div>
                    <div class="grid gap-[1.6rem] sm:grid-cols-2 lg:grid-cols-3">
                        <VSkeleton
                            v-for="key in SKELETON_KEYS"
                            :key="key"
                            height="22rem"
                        />
                    </div>
                </div>

                <template v-else-if="!pageError">
                    <CasesFilters
                        v-model:category="selectedCategory"
                        v-model:difficulty="selectedDifficulty"
                        v-model:query="searchQuery"
                        :categories="categories"
                        :difficulties="difficulties"
                    />

                    <p class="mb-[1.6rem] mt-[1.6rem] text-[1.3rem] text-text-secondary">
                        <template v-if="isFiltered">
                            Показано {{ filteredCases.length }} из {{ cases.length }} кейсов
                        </template>
                        <template v-else>
                            {{ cases.length }} кейсов
                        </template>
                    </p>

                    <VEmptyState
                        v-if="filteredCases.length === 0 && isFiltered"
                        title="Ничего не нашлось"
                        description="Попробуйте сбросить фильтры или изменить запрос."
                    >
                        <template #action>
                            <VButton
                                variant="secondary"
                                @click="handleResetFilters"
                            >
                                Сбросить фильтры
                            </VButton>
                        </template>
                    </VEmptyState>

                    <VEmptyState
                        v-else-if="cases.length === 0"
                        title="Пока нет кейсов"
                        description="Загляните позже — библиотека постоянно пополняется."
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
