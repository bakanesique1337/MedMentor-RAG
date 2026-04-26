# Phase 7: Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all five placeholder views with real MVP pages covering the full authenticated user flow from landing through case selection, simulation completion, and profile review.

**Architecture:** Views act as orchestration layers — they own page state and call existing composables directly. Page-specific visual complexity is extracted into focused components under `src/components/cases/`, `src/components/profile/`, and `src/components/chat/`. No new Pinia stores. All page state is `ref`/`computed` inside views. REST is the canonical source of truth; WebSocket streaming augments progressive rendering only.

**Tech Stack:** Vue 3 Composition API, TypeScript, Tailwind 4 (custom design tokens), Bun, UI kit at `src/components/ui`, composables at `src/composables/`, types at `src/types/index.ts`.

---

## File Map

**Create:**
- `src/constants/simulationQuickPrompts.ts`
- `src/components/cases/CaseCard.vue`
- `src/components/cases/CasesFilters.vue`
- `src/components/cases/ActiveSessionBanner.vue`
- `src/components/profile/HistoryItem.vue`
- `src/components/chat/ChatMessageBubble.vue`
- `src/components/chat/ChatTimeline.vue`
- `src/components/chat/ChatSidebar.vue`
- `src/components/chat/ChatInputBar.vue`
- `src/components/chat/DiagnosisPanel.vue`
- `src/components/chat/SessionScoreCard.vue`

**Modify:**
- `src/components/layout/AppLayout.vue` — add `flex flex-col` to `<main>` for chat layout
- `src/views/HomeView.vue` — replace UI-kit demo with real landing page
- `src/views/NotFoundView.vue` — add auth-aware cases action
- `src/views/CasesView.vue` — full cases page
- `src/views/ProfileView.vue` — full profile page
- `src/views/ChatView.vue` — full simulation workspace

---

## Task 1: Quick-prompt constants

**Files:**
- Create: `src/constants/simulationQuickPrompts.ts`

- [ ] Create the file:

```typescript
export interface QuickPrompt {
    label: string;
    content: string;
}

export const SIMULATION_QUICK_PROMPTS: readonly QuickPrompt[] = [
    {
        label: 'Physical examination',
        content: 'I would like to perform a physical examination.',
    },
    {
        label: 'Laboratory diagnostics',
        content: 'I would like to order laboratory diagnostics.',
    },
    {
        label: 'Instrumental diagnostics',
        content: 'I would like to order instrumental diagnostics.',
    },
] as const
```

- [ ] Verify: `bun run type-check` — passes with no errors.

- [ ] Commit:
```bash
git add src/constants/simulationQuickPrompts.ts
git commit -m "feat(chat): add simulation quick-prompt constants"
```

---

## Task 2: Fix AppLayout for chat height

**Files:**
- Modify: `src/components/layout/AppLayout.vue`

The chat page needs `<main>` to be a flex column so `flex-1` children fill the available height. Without this, `ChatTimeline` cannot scroll independently.

- [ ] Change `<main class="flex-1">` to `<main class="flex flex-1 flex-col">`:

```vue
<template>
    <div
        data-layout="app"
        class="flex min-h-screen flex-col"
    >
        <TheHeader variant="app" />

        <main class="flex flex-1 flex-col">
            <RouterView />
        </main>

        <TheFooter variant="app" />
    </div>
</template>
```

- [ ] Verify: `bun run type-check` passes.

- [ ] Commit:
```bash
git add src/components/layout/AppLayout.vue
git commit -m "fix(layout): make AppLayout main a flex column for chat height"
```

---

## Task 3: Landing page (`HomeView.vue`)

**Files:**
- Modify: `src/views/HomeView.vue`

- [ ] Replace the entire file content:

```vue
<script setup lang="ts">
import { useRouter } from 'vue-router'

import { VBadge, VButton, VCard } from '@/components/ui'
import { ROUTES } from '@/constants/routes'
import { useAuthGateStore } from '@/stores/authGate'

const router = useRouter()
const authGate = useAuthGateStore()

/**
 * Handles the primary CTA.
 * Authenticated users navigate to cases; guests open the auth modal.
 */
function handlePrimaryCta(): void {
    if (authGate.isAuthenticated) {
        void router.push({ name: ROUTES.CASES })
        return
    }
    authGate.openAuthModal()
}
</script>

<template>
    <div>
        <!-- Hero -->
        <section class="bg-surface-base px-4 py-20 text-center">
            <div class="mx-auto max-w-[76.8rem]">
                <VBadge variant="primary" class="mb-4">AI-Powered Medical Training</VBadge>
                <h1 class="mt-4 text-display font-semibold text-text-primary">
                    Train Clinical Reasoning<br />With Virtual Patient Simulations
                </h1>
                <p class="mx-auto mt-6 max-w-[56rem] text-body text-text-secondary">
                    Practice history-taking and diagnostic reasoning in realistic virtual patient
                    encounters. Every response is grounded in verified clinical knowledge.
                </p>
                <div class="mt-8">
                    <VButton
                        size="lg"
                        @click="handlePrimaryCta"
                    >
                        {{ authGate.isAuthenticated ? 'Browse Cases' : 'Get Started' }}
                    </VButton>
                </div>
            </div>
        </section>

        <!-- How it works -->
        <section class="bg-surface-sunken px-4 py-16">
            <div class="mx-auto max-w-384">
                <h2 class="text-center text-h1 font-semibold text-text-primary">How It Works</h2>
                <p class="mt-2 text-center text-body text-text-secondary">
                    Three steps from sign-in to clinical feedback.
                </p>
                <div class="mt-10 grid gap-6 md:grid-cols-3">
                    <VCard variant="default">
                        <div class="flex flex-col gap-3">
                            <span
                                class="inline-flex h-[4rem] w-[4rem] items-center justify-center rounded-full bg-interactive-primary-default text-body font-bold text-text-inverse"
                            >1</span>
                            <h3 class="text-h2 font-semibold text-text-primary">Choose a Case</h3>
                            <p class="text-body-sm text-text-secondary">
                                Browse a library of clinical cases across multiple specialties and
                                difficulty levels. Each case presents a unique patient scenario.
                            </p>
                        </div>
                    </VCard>
                    <VCard variant="default">
                        <div class="flex flex-col gap-3">
                            <span
                                class="inline-flex h-[4rem] w-[4rem] items-center justify-center rounded-full bg-interactive-primary-default text-body font-bold text-text-inverse"
                            >2</span>
                            <h3 class="text-h2 font-semibold text-text-primary">Interview the Patient</h3>
                            <p class="text-body-sm text-text-secondary">
                                Conduct a structured clinical conversation. Ask about symptoms,
                                history, and request examinations. The patient responds based on
                                verified clinical data only.
                            </p>
                        </div>
                    </VCard>
                    <VCard variant="default">
                        <div class="flex flex-col gap-3">
                            <span
                                class="inline-flex h-[4rem] w-[4rem] items-center justify-center rounded-full bg-interactive-primary-default text-body font-bold text-text-inverse"
                            >3</span>
                            <h3 class="text-h2 font-semibold text-text-primary">Submit Your Diagnosis</h3>
                            <p class="text-body-sm text-text-secondary">
                                Select your diagnosis when ready. Receive detailed scoring on
                                communication quality, thoroughness, empathy, and diagnostic
                                accuracy.
                            </p>
                        </div>
                    </VCard>
                </div>
            </div>
        </section>

        <!-- RAG approach -->
        <section class="bg-surface-base px-4 py-16">
            <div class="mx-auto grid max-w-384 gap-10 md:grid-cols-2 md:items-center">
                <div>
                    <VBadge variant="success">Fact-Grounded AI</VBadge>
                    <h2 class="mt-3 text-h1 font-semibold text-text-primary">
                        No Hallucinations. Only Verified Clinical Data.
                    </h2>
                    <p class="mt-4 text-body text-text-secondary">
                        MedMentor uses Retrieval-Augmented Generation. Before generating any
                        patient response, the system performs semantic search over a structured
                        clinical knowledge base. The AI verbalizes only what the retrieved
                        evidence supports.
                    </p>
                    <p class="mt-3 text-body text-text-secondary">
                        This makes the simulation reliable for medical education: what the
                        patient says is what the case data supports, every time.
                    </p>
                </div>
                <div class="flex flex-col gap-3">
                    <VCard variant="outlined">
                        <div class="flex flex-col gap-1">
                            <p class="text-body-sm font-semibold text-text-primary">Structured Knowledge Base</p>
                            <p class="text-body-sm text-text-secondary">
                                Clinical case data stored and indexed for semantic retrieval.
                            </p>
                        </div>
                    </VCard>
                    <VCard variant="outlined">
                        <div class="flex flex-col gap-1">
                            <p class="text-body-sm font-semibold text-text-primary">Retrieval Before Generation</p>
                            <p class="text-body-sm text-text-secondary">
                                Patient responses are generated only after relevant facts are retrieved.
                            </p>
                        </div>
                    </VCard>
                    <VCard variant="outlined">
                        <div class="flex flex-col gap-1">
                            <p class="text-body-sm font-semibold text-text-primary">Traceable Outputs</p>
                            <p class="text-body-sm text-text-secondary">
                                Every claim in the dialogue is backed by a verifiable clinical source.
                            </p>
                        </div>
                    </VCard>
                </div>
            </div>
        </section>

        <!-- Benefits -->
        <section class="bg-surface-sunken px-4 py-16">
            <div class="mx-auto max-w-384">
                <h2 class="text-center text-h1 font-semibold text-text-primary">
                    Built for Medical Education
                </h2>
                <div class="mt-10 grid gap-6 md:grid-cols-2">
                    <VCard variant="default">
                        <div class="flex flex-col gap-2">
                            <h3 class="text-h2 font-semibold text-text-primary">For Medical Students</h3>
                            <p class="text-body-sm text-text-secondary">
                                Build history-taking and reasoning skills before clinical rotations.
                                Practice with diverse cases across specialties at your own pace,
                                with immediate objective feedback on every session.
                            </p>
                        </div>
                    </VCard>
                    <VCard variant="default">
                        <div class="flex flex-col gap-2">
                            <h3 class="text-h2 font-semibold text-text-primary">For CME Programs</h3>
                            <p class="text-body-sm text-text-secondary">
                                Offer flexible, self-paced simulation exercises for continuing
                                medical education. Track performance metrics across sessions and
                                demonstrate competency through scored diagnostic outcomes.
                            </p>
                        </div>
                    </VCard>
                </div>
            </div>
        </section>

        <!-- Bottom CTA -->
        <section class="bg-surface-base px-4 py-20 text-center">
            <div class="mx-auto max-w-[56rem]">
                <h2 class="text-h1 font-semibold text-text-primary">Ready to Start Training?</h2>
                <p class="mt-3 text-body text-text-secondary">
                    Access the case library and begin your first simulation session in minutes.
                </p>
                <div class="mt-8">
                    <VButton
                        size="lg"
                        @click="handlePrimaryCta"
                    >
                        {{ authGate.isAuthenticated ? 'Browse Cases' : 'Sign In to Start' }}
                    </VButton>
                </div>
            </div>
        </section>
    </div>
</template>
```

- [ ] Verify: `bun run type-check` passes.

- [ ] Commit:
```bash
git add src/views/HomeView.vue
git commit -m "feat(home): replace UI-kit demo with real landing page"
```

---

## Task 4: 404 page (`NotFoundView.vue`)

**Files:**
- Modify: `src/views/NotFoundView.vue`

- [ ] Replace the entire file:

```vue
<script setup lang="ts">
import { useRouter } from 'vue-router'

import { VButton } from '@/components/ui'
import { ROUTES } from '@/constants/routes'
import { useAuthGateStore } from '@/stores/authGate'

const router = useRouter()
const authGate = useAuthGateStore()
</script>

<template>
    <div class="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div class="flex flex-col items-center gap-4 text-center">
            <p class="text-[8rem] font-bold leading-none text-text-tertiary">404</p>
            <h1 class="text-h2 font-semibold text-text-primary">Page not found</h1>
            <p class="max-w-[40rem] text-body text-text-secondary">
                The page you are looking for does not exist or has been moved.
            </p>
            <div class="mt-2 flex flex-wrap justify-center gap-3">
                <VButton
                    variant="secondary"
                    @click="router.push({ name: ROUTES.HOME })"
                >
                    Go to home
                </VButton>
                <VButton
                    v-if="authGate.isAuthenticated"
                    @click="router.push({ name: ROUTES.CASES })"
                >
                    Browse cases
                </VButton>
            </div>
        </div>
    </div>
</template>
```

- [ ] Verify: `bun run type-check` passes.

- [ ] Commit:
```bash
git add src/views/NotFoundView.vue
git commit -m "feat(404): add auth-aware cases action to 404 page"
```

---

## Task 5: `CaseCard.vue`

**Files:**
- Create: `src/components/cases/CaseCard.vue`

- [ ] Create the file:

```vue
<script setup lang="ts">
import { VBadge, VButton, VTag } from '@/components/ui'
import type { CaseCard } from '@/types'

interface Props {
    caseData: CaseCard
    isActive: boolean
    activeSessionId: number | null
    isStartPending: boolean
}

const emit = defineEmits<{
    start: [caseId: string]
    resume: [sessionId: number]
}>()

const props = defineProps<Props>()

const DIFFICULTY_VARIANT: Record<string, 'neutral' | 'warning' | 'error' | 'primary'> = {
    easy: 'neutral',
    beginner: 'neutral',
    medium: 'warning',
    intermediate: 'warning',
    hard: 'error',
    advanced: 'error',
}

/**
 * Returns a badge variant for the given difficulty string.
 */
function getDifficultyVariant(difficulty: string): 'neutral' | 'warning' | 'error' | 'primary' {
    return DIFFICULTY_VARIANT[difficulty.toLowerCase()] ?? 'primary'
}

/**
 * Emits the start event with this case's ID.
 */
function handleStart(): void {
    emit('start', props.caseData.id)
}

/**
 * Emits the resume event with the active session ID.
 */
function handleResume(): void {
    if (props.activeSessionId !== null) {
        emit('resume', props.activeSessionId)
    }
}
</script>

<template>
    <VCard
        variant="default"
        as="article"
    >
        <template #header>
            <div class="flex items-start justify-between gap-2">
                <h3 class="text-body font-semibold text-text-primary">{{ caseData.title }}</h3>
                <div class="flex shrink-0 flex-wrap gap-1">
                    <VBadge variant="primary">{{ caseData.category }}</VBadge>
                    <VBadge :variant="getDifficultyVariant(caseData.difficulty)">
                        {{ caseData.difficulty }}
                    </VBadge>
                </div>
            </div>
        </template>

        <div class="flex flex-col gap-3">
            <div>
                <p class="text-body-sm font-medium text-text-primary">{{ caseData.patientName }}</p>
                <p class="text-label text-text-secondary">
                    {{ caseData.patientAge }} years &middot; {{ caseData.patientSex }}
                </p>
            </div>

            <p class="text-body-sm text-text-secondary">{{ caseData.patientBrief }}</p>

            <div
                v-if="caseData.tags.length > 0"
                class="flex flex-wrap gap-1"
            >
                <VTag
                    v-for="tag in caseData.tags"
                    :key="tag"
                    variant="neutral"
                >{{ tag }}</VTag>
            </div>

            <div class="flex flex-wrap gap-2 pt-1">
                <VButton
                    v-if="isActive && activeSessionId !== null"
                    size="sm"
                    @click="handleResume"
                >
                    Resume session
                </VButton>
                <VButton
                    v-else
                    size="sm"
                    variant="secondary"
                    :disabled="isStartPending"
                    :loading="isStartPending"
                    @click="handleStart"
                >
                    Start case
                </VButton>
            </div>
        </div>
    </VCard>
</template>
```

- [ ] Verify: `bun run type-check` passes.

- [ ] Commit:
```bash
git add src/components/cases/CaseCard.vue
git commit -m "feat(cases): add CaseCard component"
```

---

## Task 6: `CasesFilters.vue`

**Files:**
- Create: `src/components/cases/CasesFilters.vue`

- [ ] Create the file:

```vue
<script setup lang="ts">
import { computed } from 'vue'

import { VSelect } from '@/components/ui'
import type { SelectOption } from '@/components/ui'

interface Props {
    categories: string[]
    difficulties: string[]
    category: string
    difficulty: string
}

const emit = defineEmits<{
    'update:category': [value: string]
    'update:difficulty': [value: string]
}>()

const props = defineProps<Props>()

/**
 * Category options with an "All" sentinel at the top.
 */
const categoryOptions = computed<SelectOption[]>(() => [
    { label: 'All categories', value: '' },
    ...props.categories.map((c) => ({ label: c, value: c })),
])

/**
 * Difficulty options with an "All" sentinel at the top.
 */
const difficultyOptions = computed<SelectOption[]>(() => [
    { label: 'All difficulties', value: '' },
    ...props.difficulties.map((d) => ({ label: d, value: d })),
])
</script>

<template>
    <div class="flex flex-wrap gap-3">
        <VSelect
            :model-value="category"
            :options="categoryOptions"
            class="min-w-[18rem]"
            @update:model-value="emit('update:category', String($event))"
        />
        <VSelect
            :model-value="difficulty"
            :options="difficultyOptions"
            class="min-w-[18rem]"
            @update:model-value="emit('update:difficulty', String($event))"
        />
    </div>
</template>
```

- [ ] Verify: `bun run type-check` passes.

- [ ] Commit:
```bash
git add src/components/cases/CasesFilters.vue
git commit -m "feat(cases): add CasesFilters component"
```

---

## Task 7: `ActiveSessionBanner.vue`

**Files:**
- Create: `src/components/cases/ActiveSessionBanner.vue`

- [ ] Create the file:

```vue
<script setup lang="ts">
import { useRouter } from 'vue-router'

import { VButton } from '@/components/ui'
import { ROUTES } from '@/constants/routes'
import type { ActiveSimulation } from '@/types'

interface Props {
    session: ActiveSimulation
}

const props = defineProps<Props>()
const router = useRouter()

/**
 * Navigates to the active session's chat page.
 */
async function handleResume(): Promise<void> {
    await router.push({ name: ROUTES.CHAT, params: { sessionId: String(props.session.id) } })
}
</script>

<template>
    <div class="flex items-center justify-between gap-4 rounded-2xl border border-border-default bg-surface-elevated px-4 py-3">
        <div class="flex flex-col gap-0.5">
            <p class="text-body-sm font-semibold text-text-primary">Unfinished session</p>
            <p class="text-label text-text-secondary">
                {{ session.caseTitle }} &mdash; {{ session.patientName }}
            </p>
        </div>
        <VButton
            size="sm"
            variant="secondary"
            @click="handleResume"
        >
            Resume
        </VButton>
    </div>
</template>
```

- [ ] Verify: `bun run type-check` passes.

- [ ] Commit:
```bash
git add src/components/cases/ActiveSessionBanner.vue
git commit -m "feat(cases): add ActiveSessionBanner component"
```

---

## Task 8: `CasesView.vue`

**Files:**
- Modify: `src/views/CasesView.vue`

- [ ] Replace the entire file:

```vue
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
 * Fetches the currently active session. Non-blocking — failures are silently ignored.
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
    void fetchCases()
    void fetchActiveSession()
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
```

- [ ] Verify: `bun run type-check` passes.

- [ ] Commit:
```bash
git add src/views/CasesView.vue
git commit -m "feat(cases): implement cases list page with filtering and session management"
```

---

## Task 9: `HistoryItem.vue`

**Files:**
- Create: `src/components/profile/HistoryItem.vue`

- [ ] Create the file:

```vue
<script setup lang="ts">
import { VBadge, VSkeleton } from '@/components/ui'
import type { HistorySession, MessageRole, Score, SimulationSession } from '@/types'

interface Props {
    session: HistorySession
    isExpanded: boolean
    detail: SimulationSession | null
    isDetailLoading: boolean
}

const emit = defineEmits<{
    toggle: [id: number]
}>()

const props = defineProps<Props>()

type ScoreKey = Exclude<keyof Score, 'createdAt'>

const SCORE_LABELS: Array<[ScoreKey, string]> = [
    ['politeness', 'Politeness'],
    ['questioningStructure', 'Questioning'],
    ['thoroughness', 'Thoroughness'],
    ['empathy', 'Empathy'],
    ['diagnosisCorrect', 'Diagnosis'],
]

const ROLE_LABEL: Record<MessageRole, string> = {
    DOCTOR: 'Doctor',
    PATIENT: 'Patient',
    SYSTEM: 'System',
}

/**
 * Returns a short locale date string for display.
 */
function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

/**
 * Formats a 0-1 score as a percentage string.
 */
function formatScore(value: number | null): string {
    if (value === null) return 'N/A'
    return `${Math.round(value * 100)}%`
}

/**
 * Emits toggle for this session entry.
 */
function handleToggle(): void {
    emit('toggle', props.session.id)
}
</script>

<template>
    <div class="border-b border-border-subtle last:border-b-0">
        <!-- Summary row -->
        <button
            type="button"
            class="flex w-full items-center justify-between gap-3 px-1 py-3 text-left transition-colors hover:bg-interactive-ghost-hover"
            @click="handleToggle"
        >
            <div class="flex flex-1 flex-col gap-0.5">
                <p class="text-body-sm font-medium text-text-primary">{{ session.caseTitle }}</p>
                <p class="text-label text-text-secondary">
                    {{ session.patientName }} &middot; {{ formatDate(session.updatedAt) }}
                </p>
            </div>
            <div class="flex shrink-0 items-center gap-2">
                <VBadge
                    v-if="session.state === 'COMPLETED'"
                    variant="success"
                >
                    Completed
                </VBadge>
                <VBadge
                    v-else
                    variant="warning"
                >
                    Incomplete
                </VBadge>
                <span
                    class="text-label text-text-tertiary"
                    aria-hidden="true"
                >{{ isExpanded ? '-' : '+' }}</span>
            </div>
        </button>

        <!-- Expanded detail -->
        <div
            v-if="isExpanded"
            class="pb-4 pl-1"
        >
            <!-- Loading -->
            <div
                v-if="isDetailLoading"
                class="flex flex-col gap-2 py-2"
            >
                <VSkeleton
                    height="2rem"
                    shape="rectangle"
                />
                <VSkeleton
                    width="80%"
                    height="2rem"
                    shape="rectangle"
                />
            </div>

            <template v-else-if="detail">
                <!-- Score grid -->
                <div
                    v-if="detail.score"
                    class="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-5"
                >
                    <div
                        v-for="[key, label] in SCORE_LABELS"
                        :key="key"
                        class="flex flex-col items-center gap-0.5 rounded-xl border border-border-subtle bg-surface-sunken p-2 text-center"
                    >
                        <p class="text-label text-text-secondary">{{ label }}</p>
                        <p class="text-body-sm font-semibold text-text-primary">
                            {{ formatScore(detail.score[key]) }}
                        </p>
                    </div>
                </div>

                <!-- Result summary -->
                <p
                    v-if="detail.result"
                    class="mb-4 text-body-sm text-text-secondary"
                >
                    {{ detail.result.summary }}
                </p>

                <!-- Conversation -->
                <div class="flex flex-col gap-1.5">
                    <div
                        v-for="msg in detail.messages"
                        :key="msg.id"
                        class="text-body-sm"
                    >
                        <span class="font-medium text-text-tertiary">{{ ROLE_LABEL[msg.role] }}:</span>
                        <span class="ml-1 text-text-secondary">{{ msg.content }}</span>
                    </div>
                </div>
            </template>

            <p
                v-else
                class="text-body-sm text-text-secondary"
            >
                Session details are not available.
            </p>
        </div>
    </div>
</template>
```

- [ ] Verify: `bun run type-check` passes.

- [ ] Commit:
```bash
git add src/components/profile/HistoryItem.vue
git commit -m "feat(profile): add HistoryItem component with inline expansion"
```

---

## Task 10: `ProfileView.vue`

**Files:**
- Modify: `src/views/ProfileView.vue`

- [ ] Replace the entire file:

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue'

import HistoryItem from '@/components/profile/HistoryItem.vue'
import {
    VAlert,
    VAvatar,
    VButton,
    VCard,
    VEmptyState,
    VInput,
    VSkeleton,
} from '@/components/ui'
import { useProfileApi } from '@/composables/useProfileApi'
import { useAuthGateStore } from '@/stores/authGate'
import type {
    HistorySession,
    SimulationSession,
    SimulationStatsOverview,
    UserSettings,
} from '@/types'

const profileApi = useProfileApi()
const authGate = useAuthGateStore()

// Data
const userSettings = ref<UserSettings | null>(null)
const stats = ref<SimulationStatsOverview | null>(null)
const historyList = ref<HistorySession[]>([])

// Loading / error
const isLoading = ref(true)
const loadError = ref<string | null>(null)

// Settings form
const formDisplayName = ref('')
const isSettingsPending = ref(false)
const settingsSaveError = ref<string | null>(null)
const settingsSaveSuccess = ref(false)

// History detail expansion
const expandedHistoryId = ref<number | null>(null)
const historyDetailCache = ref<Map<number, SimulationSession>>(new Map())
const loadingDetailId = ref<number | null>(null)

/**
 * Loads settings, stats, and history in parallel.
 */
async function fetchProfileData(): Promise<void> {
    isLoading.value = true
    loadError.value = null

    try {
        const [settingsResult, statsResult, historyResult] = await Promise.all([
            profileApi.settings(),
            profileApi.stats(),
            profileApi.history(),
        ])

        userSettings.value = settingsResult
        stats.value = statsResult
        historyList.value = historyResult
        formDisplayName.value = settingsResult.displayName
    } catch {
        loadError.value = 'Failed to load profile data. Please refresh.'
    } finally {
        isLoading.value = false
    }
}

/**
 * Saves updated display name while preserving all existing settings keys.
 */
async function handleSaveSettings(): Promise<void> {
    if (!userSettings.value || isSettingsPending.value) return

    isSettingsPending.value = true
    settingsSaveError.value = null
    settingsSaveSuccess.value = false

    try {
        const updated = await profileApi.updateSettings({
            displayName: formDisplayName.value.trim(),
            settings: userSettings.value.settings,
        })

        userSettings.value = updated
        formDisplayName.value = updated.displayName
        settingsSaveSuccess.value = true
        // Note: the auth store display name syncs on next bootstrap (page reload / re-login).
    } catch {
        settingsSaveError.value = 'Failed to save settings. Please try again.'
    } finally {
        isSettingsPending.value = false
    }
}

/**
 * Formats a 0-1 stat value as a percentage, or "N/A" if null.
 */
function formatStat(value: number | null): string {
    if (value === null) return 'N/A'
    return `${Math.round(value * 100)}%`
}

/**
 * Toggles inline expansion for a history entry and fetches detail on first open.
 */
async function handleToggleHistory(sessionId: number): Promise<void> {
    if (expandedHistoryId.value === sessionId) {
        expandedHistoryId.value = null
        return
    }

    expandedHistoryId.value = sessionId

    if (historyDetailCache.value.has(sessionId)) return

    loadingDetailId.value = sessionId

    try {
        const detail = await profileApi.historyDetail(sessionId)
        historyDetailCache.value = new Map([...historyDetailCache.value, [sessionId, detail]])
    } catch {
        // Non-blocking: HistoryItem shows a fallback message.
    } finally {
        loadingDetailId.value = null
    }
}

onMounted(() => {
    void fetchProfileData()
})
</script>

<template>
    <div class="mx-auto w-full max-w-384 px-4 py-8">
        <!-- Loading -->
        <div
            v-if="isLoading"
            class="flex flex-col gap-6"
        >
            <VSkeleton
                height="14rem"
                shape="rectangle"
            />
            <VSkeleton
                height="20rem"
                shape="rectangle"
            />
            <VSkeleton
                height="16rem"
                shape="rectangle"
            />
        </div>

        <!-- Load error -->
        <VAlert
            v-else-if="loadError"
            status="error"
            title="Could not load profile"
            :description="loadError"
        />

        <!-- Content -->
        <template v-else>
            <div class="grid gap-6 lg:grid-cols-3">
                <!-- Left: identity + settings + history -->
                <div class="flex flex-col gap-6 lg:col-span-2">
                    <!-- Identity and settings -->
                    <VCard variant="default">
                        <template #header>
                            <div class="flex items-center gap-3">
                                <VAvatar
                                    :name="authGate.displayName"
                                    size="lg"
                                />
                                <div>
                                    <p class="text-body font-semibold text-text-primary">
                                        {{ userSettings?.displayName ?? authGate.displayName }}
                                    </p>
                                    <p class="text-body-sm text-text-secondary">
                                        @{{ userSettings?.username }}
                                    </p>
                                </div>
                            </div>
                        </template>

                        <div class="flex flex-col gap-4">
                            <VInput
                                v-model="formDisplayName"
                                label="Display name"
                                placeholder="Your display name"
                            />

                            <VAlert
                                v-if="settingsSaveSuccess"
                                status="success"
                                description="Settings saved."
                            />
                            <VAlert
                                v-if="settingsSaveError"
                                status="error"
                                :description="settingsSaveError"
                            />

                            <div>
                                <VButton
                                    :disabled="isSettingsPending"
                                    :loading="isSettingsPending"
                                    @click="handleSaveSettings"
                                >
                                    Save
                                </VButton>
                            </div>
                        </div>
                    </VCard>

                    <!-- Session history -->
                    <VCard variant="default">
                        <template #header>
                            <h2 class="text-h2 font-semibold text-text-primary">Session History</h2>
                        </template>

                        <VEmptyState
                            v-if="historyList.length === 0"
                            title="No sessions yet"
                            description="Your completed simulation sessions will appear here."
                        />

                        <div
                            v-else
                            class="flex flex-col"
                        >
                            <HistoryItem
                                v-for="session in historyList"
                                :key="session.id"
                                :session="session"
                                :is-expanded="expandedHistoryId === session.id"
                                :detail="historyDetailCache.get(session.id) ?? null"
                                :is-detail-loading="loadingDetailId === session.id"
                                @toggle="handleToggleHistory"
                            />
                        </div>
                    </VCard>
                </div>

                <!-- Right: stats -->
                <div>
                    <VCard variant="default">
                        <template #header>
                            <h2 class="text-h2 font-semibold text-text-primary">Learning Stats</h2>
                        </template>

                        <div
                            v-if="stats"
                            class="flex flex-col gap-4"
                        >
                            <div class="text-center">
                                <p class="text-[4.8rem] font-bold leading-none text-text-primary">
                                    {{ stats.completedSessions }}
                                </p>
                                <p class="mt-1 text-body-sm text-text-secondary">Completed sessions</p>
                            </div>

                            <div class="grid grid-cols-2 gap-2">
                                <div
                                    class="flex flex-col items-center gap-0.5 rounded-xl border border-border-subtle bg-surface-sunken p-3 text-center"
                                >
                                    <p class="text-label text-text-secondary">Politeness</p>
                                    <p class="text-h2 font-semibold text-text-primary">
                                        {{ formatStat(stats.averagePoliteness) }}
                                    </p>
                                </div>
                                <div
                                    class="flex flex-col items-center gap-0.5 rounded-xl border border-border-subtle bg-surface-sunken p-3 text-center"
                                >
                                    <p class="text-label text-text-secondary">Questioning</p>
                                    <p class="text-h2 font-semibold text-text-primary">
                                        {{ formatStat(stats.averageQuestioningStructure) }}
                                    </p>
                                </div>
                                <div
                                    class="flex flex-col items-center gap-0.5 rounded-xl border border-border-subtle bg-surface-sunken p-3 text-center"
                                >
                                    <p class="text-label text-text-secondary">Thoroughness</p>
                                    <p class="text-h2 font-semibold text-text-primary">
                                        {{ formatStat(stats.averageThoroughness) }}
                                    </p>
                                </div>
                                <div
                                    class="flex flex-col items-center gap-0.5 rounded-xl border border-border-subtle bg-surface-sunken p-3 text-center"
                                >
                                    <p class="text-label text-text-secondary">Empathy</p>
                                    <p class="text-h2 font-semibold text-text-primary">
                                        {{ formatStat(stats.averageEmpathy) }}
                                    </p>
                                </div>
                                <div
                                    class="col-span-2 flex flex-col items-center gap-0.5 rounded-xl border border-border-subtle bg-surface-sunken p-3 text-center"
                                >
                                    <p class="text-label text-text-secondary">Diagnosis Accuracy</p>
                                    <p class="text-h2 font-semibold text-text-primary">
                                        {{ formatStat(stats.averageDiagnosisCorrect) }}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <p
                            v-else
                            class="text-body-sm text-text-secondary"
                        >
                            No stats available yet.
                        </p>
                    </VCard>
                </div>
            </div>
        </template>
    </div>
</template>
```

- [ ] Verify: `bun run type-check` passes.

- [ ] Commit:
```bash
git add src/views/ProfileView.vue
git commit -m "feat(profile): implement profile page with settings, stats, and history"
```

---

## Task 11: Chat supporting components

**Files:**
- Create: `src/components/chat/ChatMessageBubble.vue`
- Create: `src/components/chat/ChatTimeline.vue`
- Create: `src/components/chat/ChatSidebar.vue`
- Create: `src/components/chat/ChatInputBar.vue`
- Create: `src/components/chat/DiagnosisPanel.vue`
- Create: `src/components/chat/SessionScoreCard.vue`

- [ ] Create `ChatMessageBubble.vue`:

```vue
<script setup lang="ts">
import type { MessageRole } from '@/types'

interface Props {
    role: MessageRole
    content: string
    isStreaming?: boolean
}

withDefaults(defineProps<Props>(), {
    isStreaming: false,
})
</script>

<template>
    <!-- System messages: centered, subdued -->
    <div
        v-if="role === 'SYSTEM'"
        class="flex justify-center"
    >
        <div class="max-w-[80%] rounded-xl border border-border-subtle bg-surface-sunken px-3 py-2 text-center">
            <p class="text-body-sm text-text-tertiary">{{ content }}</p>
        </div>
    </div>

    <!-- Doctor / Patient messages -->
    <div
        v-else
        :class="['flex', role === 'DOCTOR' ? 'justify-end' : 'justify-start']"
    >
        <div
            :class="[
                'max-w-[80%] rounded-2xl px-3 py-2',
                role === 'DOCTOR'
                    ? 'bg-interactive-primary-default text-text-inverse'
                    : 'border border-border-subtle bg-surface-elevated text-text-primary',
            ]"
        >
            <p class="whitespace-pre-wrap break-words text-body">{{ content }}<span
                v-if="isStreaming && content === ''"
                class="opacity-50"
            >...</span></p>
        </div>
    </div>
</template>
```

- [ ] Create `ChatTimeline.vue`:

```vue
<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'

import ChatMessageBubble from '@/components/chat/ChatMessageBubble.vue'
import type { ConversationMessage } from '@/types'

interface Props {
    messages: ConversationMessage[]
    pendingDoctorMessage?: string | null
    streamingContent: string
    isStreamingActive: boolean
}

withDefaults(defineProps<Props>(), {
    pendingDoctorMessage: null,
})

const timelineRef = ref<HTMLElement | null>(null)

/**
 * Scrolls the timeline container to the bottom.
 */
function scrollToBottom(): void {
    if (timelineRef.value) {
        timelineRef.value.scrollTop = timelineRef.value.scrollHeight
    }
}

watch(
    () => [props.messages.length, props.streamingContent, props.isStreamingActive] as const,
    () => void nextTick(scrollToBottom),
)

const props = defineProps<Props>()

onMounted(() => {
    scrollToBottom()
})
</script>

<template>
    <div
        ref="timelineRef"
        class="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
    >
        <ChatMessageBubble
            v-for="msg in messages"
            :key="msg.id"
            :role="msg.role"
            :content="msg.content"
        />

        <!-- Optimistic doctor message shown before session refresh -->
        <ChatMessageBubble
            v-if="pendingDoctorMessage"
            role="DOCTOR"
            :content="pendingDoctorMessage"
        />

        <!-- Active streaming patient reply -->
        <ChatMessageBubble
            v-if="isStreamingActive"
            role="PATIENT"
            :content="streamingContent"
            :is-streaming="true"
        />

        <div
            v-if="messages.length === 0 && !isStreamingActive"
            class="flex flex-1 items-center justify-center py-8 text-center"
        >
            <p class="text-body-sm text-text-tertiary">The conversation will appear here.</p>
        </div>
    </div>
</template>
```

**Note:** `ChatTimeline.vue` calls `defineProps` twice due to the `watch` referencing `props`. Move `const props = defineProps<Props>()` before the `watch` call to fix this — the code above has them in the wrong order. Correct order:

```typescript
const props = withDefaults(defineProps<Props>(), { pendingDoctorMessage: null })

watch(
    () => [props.messages.length, props.streamingContent, props.isStreamingActive] as const,
    () => void nextTick(scrollToBottom),
)
```

- [ ] Fix `ChatTimeline.vue` — replace the script block with the correct order:

```vue
<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'

import ChatMessageBubble from '@/components/chat/ChatMessageBubble.vue'
import type { ConversationMessage } from '@/types'

interface Props {
    messages: ConversationMessage[]
    pendingDoctorMessage?: string | null
    streamingContent: string
    isStreamingActive: boolean
}

const props = withDefaults(defineProps<Props>(), {
    pendingDoctorMessage: null,
})

const timelineRef = ref<HTMLElement | null>(null)

/**
 * Scrolls the timeline container to the bottom.
 */
function scrollToBottom(): void {
    if (timelineRef.value) {
        timelineRef.value.scrollTop = timelineRef.value.scrollHeight
    }
}

watch(
    () => [props.messages.length, props.streamingContent, props.isStreamingActive] as const,
    () => void nextTick(scrollToBottom),
)

onMounted(() => {
    scrollToBottom()
})
</script>

<template>
    <div
        ref="timelineRef"
        class="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
    >
        <ChatMessageBubble
            v-for="msg in messages"
            :key="msg.id"
            :role="msg.role"
            :content="msg.content"
        />

        <ChatMessageBubble
            v-if="pendingDoctorMessage"
            role="DOCTOR"
            :content="pendingDoctorMessage"
        />

        <ChatMessageBubble
            v-if="isStreamingActive"
            role="PATIENT"
            :content="streamingContent"
            :is-streaming="true"
        />

        <div
            v-if="messages.length === 0 && !isStreamingActive"
            class="flex flex-1 items-center justify-center py-8 text-center"
        >
            <p class="text-body-sm text-text-tertiary">The conversation will appear here.</p>
        </div>
    </div>
</template>
```

- [ ] Create `ChatSidebar.vue`:

```vue
<script setup lang="ts">
import { VBadge } from '@/components/ui'
import type { SimulationSession } from '@/types'

interface Props {
    session: SimulationSession
    sessionId: number
}

defineProps<Props>()

const STATE_LABEL: Record<string, string> = {
    CASE_STARTED: 'Starting',
    IN_PROGRESS: 'In Progress',
    DIAGNOSIS_SELECT: 'Select Diagnosis',
    SCORING: 'Scoring',
    COMPLETED: 'Completed',
}

const STATE_BADGE_VARIANT: Record<string, 'neutral' | 'primary' | 'success' | 'warning'> = {
    CASE_STARTED: 'neutral',
    IN_PROGRESS: 'primary',
    DIAGNOSIS_SELECT: 'warning',
    SCORING: 'warning',
    COMPLETED: 'success',
}
</script>

<template>
    <aside class="flex w-[28rem] shrink-0 flex-col gap-5 overflow-y-auto border-r border-border-subtle bg-surface-base px-4 py-6">
        <div>
            <VBadge :variant="STATE_BADGE_VARIANT[session.state] ?? 'neutral'">
                {{ STATE_LABEL[session.state] ?? session.state }}
            </VBadge>
        </div>

        <div>
            <p class="text-label text-text-secondary">Case</p>
            <p class="mt-0.5 text-body-sm font-semibold text-text-primary">{{ session.caseTitle }}</p>
        </div>

        <div>
            <p class="text-label text-text-secondary">Patient</p>
            <p class="mt-0.5 text-body-sm font-medium text-text-primary">{{ session.patientName }}</p>
        </div>

        <div>
            <p class="text-label text-text-secondary">Session</p>
            <p class="mt-0.5 font-mono text-label text-text-tertiary">#{{ sessionId }}</p>
        </div>
    </aside>
</template>
```

- [ ] Create `ChatInputBar.vue`:

```vue
<script setup lang="ts">
import { ref } from 'vue'

import { VButton, VTextarea } from '@/components/ui'
import type { QuickPrompt } from '@/constants/simulationQuickPrompts'

interface Props {
    disabled: boolean
    isSendPending: boolean
    quickPrompts: readonly QuickPrompt[]
}

const emit = defineEmits<{
    send: [content: string]
}>()

const props = defineProps<Props>()

const message = ref('')

/**
 * Emits the current message and clears the input.
 */
function handleSend(): void {
    const trimmed = message.value.trim()
    if (!trimmed || props.disabled) return
    emit('send', trimmed)
    message.value = ''
}

/**
 * Sends a predefined quick prompt through the same path as normal messages.
 */
function handleQuickPrompt(prompt: QuickPrompt): void {
    if (props.disabled) return
    emit('send', prompt.content)
}

/**
 * Sends on Enter; allows Shift+Enter for newlines.
 */
function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        handleSend()
    }
}
</script>

<template>
    <div class="shrink-0 border-t border-border-subtle bg-surface-base px-4 py-3">
        <!-- Quick prompts -->
        <div class="mb-2 flex flex-wrap gap-2">
            <VButton
                v-for="prompt in quickPrompts"
                :key="prompt.label"
                size="sm"
                variant="ghost"
                :disabled="disabled"
                @click="handleQuickPrompt(prompt)"
            >
                {{ prompt.label }}
            </VButton>
        </div>

        <!-- Input row -->
        <div class="flex gap-2">
            <div class="flex-1">
                <VTextarea
                    v-model="message"
                    placeholder="Ask the patient a question..."
                    :readonly="disabled"
                    :min-rows="1"
                    autosize
                    @keydown="handleKeydown"
                />
            </div>
            <VButton
                :disabled="disabled || message.trim() === ''"
                :loading="isSendPending"
                @click="handleSend"
            >
                Send
            </VButton>
        </div>
    </div>
</template>
```

- [ ] Create `DiagnosisPanel.vue`:

```vue
<script setup lang="ts">
import { ref } from 'vue'

import { VAlert, VButton } from '@/components/ui'

interface Props {
    diagnosisOptions: string[]
    isPending: boolean
    conflictMessage: string | null
}

const emit = defineEmits<{
    diagnose: [diagnosis: string]
}>()

const props = defineProps<Props>()

const selected = ref<string | null>(null)

/**
 * Submits the selected diagnosis.
 */
function handleSubmit(): void {
    if (!selected.value || props.isPending) return
    emit('diagnose', selected.value)
}
</script>

<template>
    <div class="shrink-0 border-t border-border-subtle bg-surface-base px-4 py-4">
        <p class="mb-3 text-body-sm font-semibold text-text-primary">Select your diagnosis</p>

        <div
            v-if="conflictMessage"
            class="mb-3"
        >
            <VAlert
                status="warning"
                :description="conflictMessage"
            />
        </div>

        <div class="mb-4 flex flex-col gap-2">
            <button
                v-for="option in diagnosisOptions"
                :key="option"
                type="button"
                :class="[
                    'rounded-xl border px-3 py-2 text-left text-body-sm transition-colors',
                    selected === option
                        ? 'border-interactive-secondary-default bg-interactive-ghost-active text-text-primary'
                        : 'border-border-default bg-surface-elevated text-text-primary hover:bg-interactive-ghost-hover',
                ]"
                @click="selected = option"
            >
                {{ option }}
            </button>
        </div>

        <VButton
            :disabled="selected === null || isPending"
            :loading="isPending"
            @click="handleSubmit"
        >
            Submit diagnosis
        </VButton>
    </div>
</template>
```

- [ ] Create `SessionScoreCard.vue`:

```vue
<script setup lang="ts">
import { VBadge, VCard } from '@/components/ui'
import type { Result, Score } from '@/types'

interface Props {
    score: Score | null
    result: Result | null
    caseTitle: string
}

defineProps<Props>()

type ScoreKey = Exclude<keyof Score, 'createdAt'>

const SCORE_LABELS: Array<[ScoreKey, string]> = [
    ['politeness', 'Politeness'],
    ['questioningStructure', 'Questioning'],
    ['thoroughness', 'Thoroughness'],
    ['empathy', 'Empathy'],
    ['diagnosisCorrect', 'Diagnosis'],
]

/**
 * Formats a 0-1 score value as a percentage string.
 */
function formatScore(value: number | null): string {
    if (value === null) return 'N/A'
    return `${Math.round(value * 100)}%`
}
</script>

<template>
    <VCard variant="elevated">
        <template #header>
            <div class="flex items-center justify-between gap-2">
                <h2 class="text-h2 font-semibold text-text-primary">Session Complete</h2>
                <VBadge variant="success">Completed</VBadge>
            </div>
            <p class="mt-1 text-body-sm text-text-secondary">{{ caseTitle }}</p>
        </template>

        <div
            v-if="score"
            class="grid grid-cols-2 gap-3 sm:grid-cols-3"
        >
            <div
                v-for="[key, label] in SCORE_LABELS"
                :key="key"
                class="flex flex-col gap-1 rounded-xl border border-border-subtle bg-surface-sunken p-3 text-center"
            >
                <p class="text-label text-text-secondary">{{ label }}</p>
                <p class="text-h2 font-semibold text-text-primary">{{ formatScore(score[key]) }}</p>
            </div>
        </div>

        <div
            v-if="result"
            class="mt-4"
        >
            <p class="text-body-sm font-semibold text-text-primary">Summary</p>
            <p class="mt-1 text-body-sm text-text-secondary">{{ result.summary }}</p>
        </div>

        <p
            v-if="!score && !result"
            class="text-body-sm text-text-secondary"
        >
            No scoring data available for this session.
        </p>
    </VCard>
</template>
```

- [ ] Verify all chat components: `bun run type-check` passes.

- [ ] Commit:
```bash
git add src/components/chat/
git commit -m "feat(chat): add chat supporting components"
```

---

## Task 12: `ChatView.vue`

**Files:**
- Modify: `src/views/ChatView.vue`

- [ ] Replace the entire file:

```vue
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ChatInputBar from '@/components/chat/ChatInputBar.vue'
import ChatSidebar from '@/components/chat/ChatSidebar.vue'
import ChatTimeline from '@/components/chat/ChatTimeline.vue'
import DiagnosisPanel from '@/components/chat/DiagnosisPanel.vue'
import SessionScoreCard from '@/components/chat/SessionScoreCard.vue'
import { VAlert, VButton, VSpinner } from '@/components/ui'
import { SIMULATION_QUICK_PROMPTS } from '@/constants/simulationQuickPrompts'
import { ROUTES } from '@/constants/routes'
import { useSimulationApi } from '@/composables/useSimulationApi'
import { useSimulationSocket } from '@/composables/useSimulationSocket'
import type { SimulationSession, StreamChunk } from '@/types'
import { isApiError } from '@/types'

const route = useRoute()
const router = useRouter()
const simulationApi = useSimulationApi()
const socket = useSimulationSocket()

// Core state
const sessionId = ref(0)
const session = ref<SimulationSession | null>(null)
const isLoading = ref(true)
const pageError = ref<string | null>(null)

// Streaming
const streamingContent = ref('')
const pendingSentMessage = ref<string | null>(null)
const isStreamingActive = ref(false)

// Actions
const isSendPending = ref(false)
const isDiagnosisPending = ref(false)
const conflictMessage = ref<string | null>(null)

// Phase flags
const isOpeningPending = computed(() =>
    session.value?.openingStatus === 'OPENING_PENDING' ||
    session.value?.openingStatus === 'OPENING_STREAMING',
)

const isOpeningFailed = computed(() =>
    session.value?.openingStatus === 'OPENING_FAILED',
)

const isDiagnosisPhase = computed(() =>
    session.value?.state === 'DIAGNOSIS_SELECT',
)

const isScoringPhase = computed(() =>
    session.value?.state === 'SCORING',
)

const isCompleted = computed(() =>
    session.value?.state === 'COMPLETED',
)

const canSendMessage = computed(() =>
    session.value !== null &&
    session.value.openingStatus === 'OPENING_READY' &&
    session.value.state === 'IN_PROGRESS' &&
    !isStreamingActive.value &&
    !isSendPending.value,
)

// ---------------------------------------------------------------------------
// Session loading
// ---------------------------------------------------------------------------

/**
 * Fetches session state from REST. Restores transient streaming UI if the backend
 * reports that a stream was in flight at the time of the request (refresh recovery).
 */
async function loadSession(options?: { retryOpening?: boolean }): Promise<void> {
    isLoading.value = true
    pageError.value = null

    try {
        const data = await simulationApi.getSession(sessionId.value, options)
        session.value = data

        const needsSocket =
            (data.streamingStatus.inFlight && data.streamingStatus.type !== 'idle') ||
            data.openingStatus === 'OPENING_PENDING' ||
            data.openingStatus === 'OPENING_STREAMING'

        if (needsSocket) {
            isStreamingActive.value = true
            socket.connect(sessionId.value)
        }
    } catch {
        pageError.value = 'Session not found or could not be loaded. Please return to cases.'
    } finally {
        isLoading.value = false
    }
}

// ---------------------------------------------------------------------------
// Streaming
// ---------------------------------------------------------------------------

/**
 * Handles an incoming stream chunk from the WebSocket.
 */
function handleChunk(chunk: StreamChunk): void {
    if (chunk.type === 'chunk' && chunk.content !== undefined) {
        streamingContent.value += chunk.content
    } else if (chunk.type === 'done') {
        void refreshAfterStream()
    } else if (chunk.type === 'error') {
        isStreamingActive.value = false
        streamingContent.value = ''
        pendingSentMessage.value = null
        pageError.value = 'Stream error occurred. Reloading session...'
        void loadSession()
    }
}

/**
 * Fetches fresh session state after a stream completes, then clears transient state.
 */
async function refreshAfterStream(): Promise<void> {
    try {
        const data = await simulationApi.getSession(sessionId.value)
        session.value = data
    } finally {
        isStreamingActive.value = false
        streamingContent.value = ''
        pendingSentMessage.value = null
    }
}

// ---------------------------------------------------------------------------
// User actions
// ---------------------------------------------------------------------------

/**
 * Sends a doctor message and initiates the patient response stream.
 */
async function handleSend(content: string): Promise<void> {
    if (!canSendMessage.value) return

    isSendPending.value = true
    conflictMessage.value = null
    pendingSentMessage.value = content

    try {
        await simulationApi.sendMessage(sessionId.value, content)
        isSendPending.value = false
        isStreamingActive.value = true
        streamingContent.value = ''
        socket.connect(sessionId.value)
    } catch (err: unknown) {
        isSendPending.value = false
        pendingSentMessage.value = null

        if (isApiError(err) && err.status === 409) {
            conflictMessage.value =
                'The patient is still responding. Please wait for the current reply to finish.'
        } else {
            pageError.value = 'Failed to send message. Please try again.'
        }
    }
}

/**
 * Submits the selected diagnosis. Session state is updated from the response.
 */
async function handleDiagnose(diagnosis: string): Promise<void> {
    if (isDiagnosisPending.value) return

    isDiagnosisPending.value = true
    conflictMessage.value = null

    try {
        const updated = await simulationApi.diagnose(sessionId.value, diagnosis)
        session.value = updated
    } catch (err: unknown) {
        if (isApiError(err) && err.status === 409) {
            conflictMessage.value =
                'Diagnosis cannot be submitted at this stage. Reloading current state...'
            void loadSession()
        } else {
            pageError.value = 'Failed to submit diagnosis. Please try again.'
        }
    } finally {
        isDiagnosisPending.value = false
    }
}

/**
 * Clears stale streaming state and retries the session opening via REST.
 */
async function handleRetryOpening(): Promise<void> {
    socket.disconnect()
    isStreamingActive.value = false
    streamingContent.value = ''
    await loadSession({ retryOpening: true })
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

let unsubscribeChunk: (() => void) | null = null

onMounted(async () => {
    unsubscribeChunk = socket.onChunk(handleChunk)

    const raw = route.params.sessionId
    const id = typeof raw === 'string' ? parseInt(raw, 10) : NaN

    if (!Number.isInteger(id) || id <= 0) {
        pageError.value =
            'Invalid session ID. Please return to cases and start a new session.'
        isLoading.value = false
        return
    }

    sessionId.value = id
    await loadSession()
})

onUnmounted(() => {
    if (unsubscribeChunk !== null) unsubscribeChunk()
    socket.disconnect()
})
</script>

<template>
    <div class="flex flex-1 overflow-hidden">
        <!-- Loading -->
        <div
            v-if="isLoading"
            class="flex flex-1 items-center justify-center"
        >
            <VSpinner size="lg" />
        </div>

        <!-- Blocking error (session not loaded at all) -->
        <div
            v-else-if="pageError && !session"
            class="mx-auto flex max-w-[56rem] flex-col gap-4 px-4 py-16"
        >
            <VAlert
                status="error"
                title="Session unavailable"
                :description="pageError"
            />
            <div>
                <VButton
                    variant="secondary"
                    @click="router.push({ name: ROUTES.CASES })"
                >
                    Back to cases
                </VButton>
            </div>
        </div>

        <!-- Main workspace -->
        <template v-else-if="session">
            <!-- Left sidebar — hidden on small screens -->
            <ChatSidebar
                :session="session"
                :session-id="sessionId"
                class="hidden lg:flex"
            />

            <!-- Right column -->
            <div class="flex flex-1 flex-col overflow-hidden">
                <!-- Non-blocking inline alert -->
                <div
                    v-if="pageError || conflictMessage"
                    class="shrink-0 px-4 pt-3"
                >
                    <VAlert
                        :status="conflictMessage ? 'warning' : 'error'"
                        :description="conflictMessage ?? pageError ?? ''"
                    />
                </div>

                <!-- Opening pending / streaming -->
                <div
                    v-if="isOpeningPending"
                    class="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-8"
                >
                    <VSpinner size="lg" />
                    <p class="text-body text-text-secondary">
                        The patient is preparing their opening statement...
                    </p>
                    <div
                        v-if="streamingContent"
                        class="w-full max-w-[72rem] rounded-2xl border border-border-subtle bg-surface-elevated px-4 py-3"
                    >
                        <p class="text-body text-text-primary">{{ streamingContent }}</p>
                    </div>
                </div>

                <!-- Opening failed -->
                <div
                    v-else-if="isOpeningFailed"
                    class="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-8"
                >
                    <VAlert
                        status="error"
                        title="Opening failed"
                        description="The patient opening could not be generated."
                    />
                    <div class="flex gap-3">
                        <VButton @click="handleRetryOpening">Retry opening</VButton>
                        <VButton
                            variant="ghost"
                            @click="router.push({ name: ROUTES.CASES })"
                        >
                            Back to cases
                        </VButton>
                    </div>
                </div>

                <!-- Scoring in progress -->
                <div
                    v-else-if="isScoringPhase"
                    class="flex flex-1 flex-col items-center justify-center gap-3"
                >
                    <VSpinner size="lg" />
                    <p class="text-body text-text-secondary">Scoring your session...</p>
                </div>

                <!-- Completed -->
                <div
                    v-else-if="isCompleted"
                    class="flex flex-1 flex-col overflow-y-auto"
                >
                    <ChatTimeline
                        :messages="session.messages"
                        streaming-content=""
                        :is-streaming-active="false"
                    />
                    <div class="shrink-0 px-4 py-6">
                        <SessionScoreCard
                            :score="session.score"
                            :result="session.result"
                            :case-title="session.caseTitle"
                        />
                        <div class="mt-4">
                            <VButton
                                variant="secondary"
                                @click="router.push({ name: ROUTES.CASES })"
                            >
                                Back to cases
                            </VButton>
                        </div>
                    </div>
                </div>

                <!-- Active: timeline + input or diagnosis -->
                <template v-else>
                    <ChatTimeline
                        :messages="session.messages"
                        :pending-doctor-message="pendingSentMessage"
                        :streaming-content="streamingContent"
                        :is-streaming-active="isStreamingActive"
                    />

                    <DiagnosisPanel
                        v-if="isDiagnosisPhase"
                        :diagnosis-options="session.diagnosisOptions"
                        :is-pending="isDiagnosisPending"
                        :conflict-message="conflictMessage"
                        @diagnose="handleDiagnose"
                    />

                    <ChatInputBar
                        v-else
                        :disabled="!canSendMessage"
                        :is-send-pending="isSendPending"
                        :quick-prompts="SIMULATION_QUICK_PROMPTS"
                        @send="handleSend"
                    />
                </template>
            </div>
        </template>
    </div>
</template>
```

- [ ] Verify: `bun run type-check` passes.

- [ ] Commit:
```bash
git add src/views/ChatView.vue
git commit -m "feat(chat): implement full simulation workspace"
```

---

## Task 13: Final verification

- [ ] Run TypeScript check:
```bash
bun run type-check
```
Expected: no errors.

- [ ] Run ESLint:
```bash
bun run el:check
```
Fix any lint errors reported, then re-run until clean.

- [ ] Run Stylelint:
```bash
bun run sl:check
```
Fix any style errors, then re-run until clean.

- [ ] Build:
```bash
bun run build
```
Expected: build completes with no errors.

- [ ] Commit any lint/style fixes:
```bash
git add -A
git commit -m "fix: address lint and style issues from P7 implementation"
```

---

## Definition of Done Cross-Check

| Requirement | Task |
|---|---|
| `HomeView.vue` is a real landing page | Task 3 |
| `NotFoundView.vue` has auth-aware cases action | Task 4 |
| `CasesView.vue` loads cases and active session, supports filtering, starts/resumes | Task 8 |
| `ProfileView.vue` loads settings, stats, history; supports safe settings update | Task 10 |
| `ChatView.vue` supports opening, in-progress, diagnosis, scoring, completed | Task 12 |
| Quick-action prompts in `simulationQuickPrompts.ts` | Task 1 |
| Chat input/quick actions obey opening/in-flight restrictions | Task 12 (`canSendMessage`) |
| 409 conflicts rendered contextually in cases and chat | Tasks 8, 12 |
| Session refresh recovery from `getSession` + streaming restore | Task 12 (`loadSession`) |
| All page loading, empty, and error states have UI treatment | Tasks 3–12 |
| `bun run type-check` passes | Task 13 |
| `bun run el:check` passes | Task 13 |
| `bun run sl:check` passes | Task 13 |
| `bun run build` passes | Task 13 |
