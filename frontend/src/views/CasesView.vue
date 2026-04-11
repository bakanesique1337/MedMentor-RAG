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

// Data
const cases = ref<CaseCardType[]>([])
const activeSession = ref<ActiveSimulation | null>(null)

// Loading states
const isLoadingCases = ref(true)
const isLoadingActive = ref(true)

// Filters
const selectedCategory = ref('')
const selectedDifficulty = ref('')

// Action state
const startPendingCaseId = ref<string | null>(null)
const pageError = ref<string | null>(null)
const conflictMessage = ref<string | null>(null)

const isLoading = computed(() => isLoadingCases.value || isLoadingActive.value)

const categories = computed<string[]>(() => {
    const seen = new Set<string>()
    return cases.value
        .map((c) => c.category)
        .filter((cat) => {
            if (seen.has(cat)) return false
            seen.add(cat)
            return true
        })
})

const difficulties = computed<string[]>(() => {
    const seen = new Set<string>()
    return cases.value
        .map((c) => c.difficulty)
        .filter((d) => {
            if (seen.has(d)) return false
            seen.add(d)
            return true
        })
})

const filteredCases = computed<CaseCardType[]>(() =>
    cases.value.filter((c) => {
        const matchesCategory = selectedCategory.value === '' || c.category === selectedCategory.value
        const matchesDifficulty = selectedDifficulty.value === '' || c.difficulty === selectedDifficulty.value
        return matchesCategory && matchesDifficulty
    }),
)

const isFiltered = computed(
    () => selectedCategory.value !== '' || selectedDifficulty.value !== '',
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
        pageError.value = 'Failed to load cases. Please refresh the page.'
    } finally {
        isLoadingCases.value = false
    }
}

/**
 * Fetches the currently active session. Non-blocking -- failures are silently ignored.
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
 * Starts a new simulation and navigates to chat.
 * On 409, refreshes active session state and shows resume guidance.
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
            conflictMessage.value =
                'You already have an active session. Resume it from the banner above or from the matching case card.'
            await fetchActiveSession()
        } else {
            pageError.value = 'Failed to start the case. Please try again.'
        }
    } finally {
        startPendingCaseId.value = null
    }
}

/**
 * Navigates to an existing session's chat page.
 */
async function handleResume(sessionId: number): Promise<void> {
    await router.push({ name: ROUTES.CHAT, params: { sessionId: String(sessionId) } })
}

/**
 * Resets all active filters.
 */
function handleResetFilters(): void {
    selectedCategory.value = ''
    selectedDifficulty.value = ''
}

onMounted(() => {
    Promise.all([fetchCases(), fetchActiveSession()])
})
</script>

<template>
    <div class="mx-auto w-full max-w-384 px-4 py-8">
        <div class="mb-6">
            <h1 class="text-h1 font-semibold text-text-primary">Clinical Cases</h1>
            <p class="mt-1 text-body text-text-secondary">
                Choose a case to start a simulation session.
            </p>
        </div>

        <!-- Active session banner -->
        <div
            v-if="!isLoadingActive && activeSession"
            class="mb-6"
        >
            <ActiveSessionBanner
                :session="activeSession"
                @resume="handleResume"
            />
        </div>

        <!-- Conflict message -->
        <div
            v-if="conflictMessage"
            class="mb-4"
        >
            <VAlert
                status="warning"
                title="Session conflict"
                :description="conflictMessage"
            />
        </div>

        <!-- Page error -->
        <div
            v-if="pageError"
            class="mb-4"
        >
            <VAlert
                status="error"
                title="Could not load cases"
                :description="pageError"
            />
        </div>

        <!-- Loading skeletons -->
        <div
            v-if="isLoading"
            class="flex flex-col gap-4"
        >
            <div class="flex gap-3">
                <VSkeleton
                    width="18rem"
                    height="3.6rem"
                    shape="rectangle"
                />
                <VSkeleton
                    width="18rem"
                    height="3.6rem"
                    shape="rectangle"
                />
            </div>
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <VSkeleton
                    v-for="n in 6"
                    :key="n"
                    height="22rem"
                    shape="rectangle"
                />
            </div>
        </div>

        <!-- Cases content -->
        <template v-else-if="!pageError">
            <CasesFilters
                v-model:category="selectedCategory"
                v-model:difficulty="selectedDifficulty"
                :categories="categories"
                :difficulties="difficulties"
            />

            <p class="mb-4 mt-4 text-body-sm text-text-secondary">
                <template v-if="isFiltered">
                    {{ filteredCases.length }} of {{ cases.length }} cases
                </template>
                <template v-else>
                    {{ cases.length }} cases
                </template>
            </p>

            <!-- Filtered empty state -->
            <VEmptyState
                v-if="filteredCases.length === 0 && isFiltered"
                title="No cases match your filters"
                description="Try clearing the filters to see all available cases."
            >
                <template #action>
                    <VButton
                        variant="secondary"
                        @click="handleResetFilters"
                    >
                        Clear filters
                    </VButton>
                </template>
            </VEmptyState>

            <!-- All-cases empty state -->
            <VEmptyState
                v-else-if="cases.length === 0"
                title="No cases available"
                description="Check back later for available clinical cases."
            />

            <!-- Case grid -->
            <div
                v-else
                class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
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
</template>
