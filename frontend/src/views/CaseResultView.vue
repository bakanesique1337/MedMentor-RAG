<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'

import ResultCriterionRow from '@/components/result/ResultCriterionRow.vue'
import ResultDiagnosisCard from '@/components/result/ResultDiagnosisCard.vue'
import ResultKeyTurnRow from '@/components/result/ResultKeyTurnRow.vue'
import ResultPanelCard from '@/components/result/ResultPanelCard.vue'
import ResultScoreRing from '@/components/result/ResultScoreRing.vue'
import ResultSectionTitle from '@/components/result/ResultSectionTitle.vue'
import VArrowRightIcon from '@/components/icons/VArrowRightIcon.vue'
import {VAlert, VButton, VSpinner} from '@/components/ui'
import {categoryDisplayLabel} from '@/constants/caseCategories'
import {
    RESULT_ABANDONED_TEXTS,
    RESULT_ACTIONS_TEXTS,
    RESULT_ALERTS_TEXTS,
    RESULT_CRITERIA_LABELS,
    RESULT_DIAGNOSIS_TEXTS,
    RESULT_HERO_TEXTS,
    RESULT_SECTION_TITLES,
    RESULT_VERSION_TAG,
    type CriterionScoreKey,
} from '@/constants/caseResultViewTexts'
import {ROUTES} from '@/constants/routes'
import {useSimulationApi} from '@/composables/api/useSimulationApi'
import type {CriterionNotes, SimulationSession} from '@/types'

type NotesKey = keyof CriterionNotes

interface CriterionEntry {
    key: CriterionScoreKey
    label: string
    value: number
    note: string | null
}

interface CriterionDef {
    scoreKey: CriterionScoreKey
    notesKey: NotesKey
}

const CRITERIA: CriterionDef[] = [
    {scoreKey: 'thoroughness', notesKey: 'thoroughness'},
    {scoreKey: 'questioningStructure', notesKey: 'questioningStructure'},
    {scoreKey: 'empathy', notesKey: 'empathy'},
    {scoreKey: 'politeness', notesKey: 'politeness'},
    {scoreKey: 'diagnosisCorrect', notesKey: 'correctDiagnosis'},
]

const route = useRoute()
const router = useRouter()
const simulationApi = useSimulationApi()

const session = ref<SimulationSession | null>(null)
const isLoading = ref(true)
const pageError = ref<string | null>(null)
const isRestartPending = ref(false)

const isAbandoned = computed(() => session.value?.state === 'ABANDONED')
const isCompleted = computed(() => session.value?.state === 'COMPLETED')

const criteria = computed<CriterionEntry[]>(() => {
    const score = session.value?.score
    const notes = session.value?.result?.criterionNotes ?? null
    if (!score) return []
    return CRITERIA.map(({scoreKey, notesKey}) => {
        const raw = score[scoreKey]
        const percent = typeof raw === 'number' && Number.isFinite(raw)
            ? Math.round(raw * 100)
            : 0
        return {
            key: scoreKey,
            label: RESULT_CRITERIA_LABELS[scoreKey],
            value: percent,
            note: notes ? notes[notesKey] ?? null : null,
        }
    })
})

const overallScore = computed(() => {
    if (criteria.value.length === 0) return 0
    const sum = criteria.value.reduce((acc, item) => acc + item.value, 0)
    const avg = sum / criteria.value.length
    return Number.isFinite(avg) ? Math.round(avg) : 0
})

const studentDiagnosisMatches = computed(() => {
    const student = session.value?.selectedDiagnosis?.trim().toLowerCase() ?? ''
    const correct = session.value?.correctDiagnosis?.trim().toLowerCase() ?? ''
    return student.length > 0 && correct.length > 0 && student === correct
})

const eyebrow = computed(() => {
    if (!session.value) return ''
    const parts = [
        RESULT_HERO_TEXTS.eyebrowLabel,
        `#${session.value.id}`,
        categoryDisplayLabel(session.value.caseCategory),
    ].filter((part) => part && part.length > 0)
    return parts.join(' · ').toUpperCase()
})

/**
 * Loads the session by id from the route params.
 */
async function fetchSession(): Promise<void> {
    const raw = route.params.sessionId
    const id = typeof raw === 'string' ? parseInt(raw, 10) : NaN
    if (!Number.isInteger(id) || id <= 0) {
        pageError.value = RESULT_ALERTS_TEXTS.invalidSessionId
        isLoading.value = false
        return
    }

    isLoading.value = true
    pageError.value = null
    try {
        const data = await simulationApi.getSession(id)
        session.value = data
        if (data.state !== 'COMPLETED' && data.state !== 'ABANDONED') {
            router.replace({name: ROUTES.CHAT, params: {sessionId: String(id)}})
                .catch(() => undefined)
        }
    } catch {
        pageError.value = RESULT_ALERTS_TEXTS.sessionNotFound
    } finally {
        isLoading.value = false
    }
}

/**
 * Navigates back to the cases catalog.
 */
function handleBackToCases(): void {
    router.push({name: ROUTES.CASES}).catch(() => undefined)
}

/**
 * Starts a fresh session for the same case.
 */
async function handleRestart(): Promise<void> {
    if (!session.value || isRestartPending.value) return
    isRestartPending.value = true
    try {
        const response = await simulationApi.start(session.value.caseId)
        await router.push({name: ROUTES.CHAT, params: {sessionId: String(response.sessionId)}})
    } catch {
        pageError.value = RESULT_ALERTS_TEXTS.restartFailed
    } finally {
        isRestartPending.value = false
    }
}

onMounted(fetchSession)
</script>

<template>
    <div class="flex flex-1 flex-col overflow-y-auto bg-surface-base text-text-primary">
        <div
            v-if="isLoading"
            class="flex flex-1 items-center justify-center"
        >
            <VSpinner size="lg"/>
        </div>

        <div
            v-else-if="pageError && !session"
            class="mx-auto flex w-full max-w-5xl flex-col gap-[1.6rem] px-[2.4rem] py-[6.4rem]"
        >
            <VAlert
                status="error"
                :title="RESULT_ALERTS_TEXTS.sessionUnavailableTitle"
                :description="pageError"
            />
            <div>
                <VButton
                    variant="secondary"
                    @click="handleBackToCases"
                >
                    {{ RESULT_ACTIONS_TEXTS.backToCases }}
                </VButton>
            </div>
        </div>

        <template v-else-if="session && isAbandoned">
            <section
                class="flex flex-1 items-center justify-center bg-linear-to-b from-(--color-bg) to-(--color-teal-ghost) px-[2.4rem]"
            >
                <div
                    class="w-full max-w-3xl rounded-lg border border-(--color-line-2) bg-white p-[3.6rem] shadow-card"
                >
                    <p class="text-eyebrow text-(--color-danger-bright)">
                        {{ RESULT_ABANDONED_TEXTS.eyebrowLabel }} · #{{ session.id }}
                    </p>

                    <h1 class="mt-4 font-serif text-[2.8rem] font-medium leading-[1.15] tracking-[-0.02em] text-text-primary">
                        {{ RESULT_ABANDONED_TEXTS.title }}
                    </h1>

                    <p class="mt-4 text-[1.4rem] leading-[1.55] text-text-secondary">
                        {{ RESULT_ABANDONED_TEXTS.description }}
                    </p>

                    <div class="mt-[2.4rem] flex flex-wrap gap-4">
                        <VButton
                            shape="rect"
                            :loading="isRestartPending"
                            @click="handleRestart"
                        >
                            {{ RESULT_ACTIONS_TEXTS.restart }}
                        </VButton>

                        <VButton
                            variant="secondary"
                            shape="rect"
                            :disabled="isRestartPending"
                            @click="handleBackToCases"
                        >
                            {{ RESULT_ACTIONS_TEXTS.backToCases }}
                        </VButton>
                    </div>
                </div>
            </section>
        </template>

        <template v-else-if="session && isCompleted">
            <section
                class="border-b border-(--color-line) bg-linear-to-b from-(--color-teal-ghost) to-(--color-bg) px-[2.8rem] py-[2.8rem]"
            >
                <div class="mx-auto w-full max-w-384">
                    <div class="mb-[1.6rem] flex flex-wrap items-baseline justify-between gap-8">
                        <p class="text-eyebrow text-brand">{{ eyebrow }}</p>
                        <VButton
                            variant="secondary"
                            shape="rect"
                            size="sm"
                            :loading="isRestartPending"
                            @click="handleRestart"
                        >
                            {{ RESULT_ACTIONS_TEXTS.restart }}
                        </VButton>
                    </div>
                    <div class="flex flex-wrap items-center gap-[2.8rem]">
                        <div class="min-w-0 flex-1">
                            <h1 class="font-serif text-[3rem] font-medium leading-[1.15] tracking-[-0.025em] text-text-primary">
                                {{ RESULT_HERO_TEXTS.titleLead }} <em class="italic text-brand">{{
                                    RESULT_HERO_TEXTS.titleAccent
                                }}</em>
                            </h1>
                            <p class="mt-[0.4rem] max-w-4xl text-[1.3rem] leading-[1.55] text-text-secondary">
                                {{ RESULT_HERO_TEXTS.description }}
                            </p>
                        </div>
                        <ResultScoreRing :score="overallScore"/>
                    </div>
                </div>
            </section>

            <section class="mx-auto w-full max-w-384 px-[2.8rem] py-[2.4rem] pb-[3.6rem]">
                <ResultSectionTitle>{{ RESULT_SECTION_TITLES.diagnosisCompare }}</ResultSectionTitle>

                <div class="mb-[2.4rem] grid grid-cols-1 gap-[1.2rem] sm:grid-cols-2">
                    <ResultDiagnosisCard
                        :label="RESULT_DIAGNOSIS_TEXTS.yourAnswer"
                        :text="session.selectedDiagnosis ?? RESULT_DIAGNOSIS_TEXTS.emptyValue"
                        :confidence="session.selectedDiagnosisConfidence"
                        :variant="studentDiagnosisMatches ? 'student-match' : 'student-miss'"
                    />
                    <ResultDiagnosisCard
                        :label="RESULT_DIAGNOSIS_TEXTS.reference"
                        :text="session.correctDiagnosis ?? RESULT_DIAGNOSIS_TEXTS.emptyValue"
                        variant="reference"
                    />
                </div>

                <ResultSectionTitle>{{ RESULT_SECTION_TITLES.criteria }}</ResultSectionTitle>

                <ResultPanelCard padding="tight">
                    <ResultCriterionRow
                        v-for="(item, index) in criteria"
                        :key="item.key"
                        :label="item.label"
                        :note="item.note"
                        :value="item.value"
                        :is-last="index === criteria.length - 1"
                    />
                </ResultPanelCard>

                <template v-if="session.result?.keyTurns?.length">
                    <ResultSectionTitle>{{ RESULT_SECTION_TITLES.keyTurns }}</ResultSectionTitle>

                    <ResultPanelCard padding="tight-y">
                        <ResultKeyTurnRow
                            v-for="(turn, index) in session.result.keyTurns"
                            :key="`${turn.turn}-${index}`"
                            :turn="turn"
                            :is-last="index === (session.result?.keyTurns.length ?? 0) - 1"
                        />
                    </ResultPanelCard>
                </template>

                <template v-if="session.result?.missedFindings?.length">
                    <ResultSectionTitle>{{ RESULT_SECTION_TITLES.missed }}</ResultSectionTitle>

                    <ResultPanelCard>
                        <ul class="m-0 list-disc space-y-[0.4rem] pl-[1.8rem] text-[1.35rem] leading-[1.65] text-text-primary">
                            <li
                                v-for="(item, index) in session.result.missedFindings"
                                :key="index"
                            >
                                {{ item }}
                            </li>
                        </ul>
                    </ResultPanelCard>
                </template>

                <template v-if="session.result?.summary">
                    <ResultSectionTitle>{{ RESULT_SECTION_TITLES.recommendations }}</ResultSectionTitle>

                    <div
                        class="mb-[1.6rem] rounded-[1.2rem] border border-[rgb(13_115_119/0.2)] bg-linear-to-br from-(--color-teal-ghost) to-(--color-teal-soft) px-[1.8rem] py-[1.6rem]"
                    >
                        <p class="font-serif text-[1.55rem] italic leading-normal text-text-primary">
                            «{{ session.result.summary }}»
                        </p>
                        <p class="mt-4 font-mono text-[1.05rem] font-semibold tracking-widest text-(--color-teal-deep)">
                            {{ RESULT_VERSION_TAG }}
                        </p>
                    </div>
                </template>

                <div class="flex flex-wrap justify-end gap-4">
                    <VButton
                        variant="secondary"
                        shape="rect"
                        :loading="isRestartPending"
                        @click="handleRestart"
                    >
                        {{ RESULT_ACTIONS_TEXTS.restart }}
                    </VButton>

                    <VButton
                        shape="rect"
                        @click="handleBackToCases"
                    >
                        {{ RESULT_ACTIONS_TEXTS.backToCases }}
                        <template #trailing>
                            <VArrowRightIcon/>
                        </template>
                    </VButton>
                </div>
            </section>
        </template>
    </div>
</template>
