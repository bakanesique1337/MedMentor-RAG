<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'

import ResultCriterionRow from '@/components/result/ResultCriterionRow.vue'
import ResultDiagnosisCard from '@/components/result/ResultDiagnosisCard.vue'
import ResultKeyTurnRow from '@/components/result/ResultKeyTurnRow.vue'
import ResultScoreRing from '@/components/result/ResultScoreRing.vue'
import ResultSectionTitle from '@/components/result/ResultSectionTitle.vue'
import {VAlert, VButton, VSpinner} from '@/components/ui'
import {categoryDisplayLabel} from '@/constants/caseCategories'
import {ROUTES} from '@/constants/routes'
import {useSimulationApi} from '@/composables/api/useSimulationApi'
import type {CriterionNotes, Score, SimulationSession} from '@/types'

const COPY = {
    sessionUnavailableTitle: 'Сессия недоступна',
    backToCasesButton: 'К списку задач',
    abandonedEyebrowPrefix: 'Задача не завершёна · #',
    abandonedTitle: 'Задача завершёна без диагноза.',
    abandonedDescription: 'Прогресс сохранён, но баллы за диагностическую точность не выставлены. Можно начать кейс заново и пройти его до конца.',
    restartButton: 'Начать заново',
    completedTitleLead: 'Разбор вашей',
    completedTitleAccent: 'диагностики',
    completedDescription: 'Модель оценила ход рассуждения, полноту анамнеза и точность диагноза. Режим только для чтения.',
    sectionDiagnosisCompare: 'Ваш диагноз vs эталон',
    sectionCriteria: 'Оценка по критериям',
    sectionKeyTurns: 'Ключевые ходы в диалоге',
    sectionMissed: 'Что было упущено',
    sectionRecommendations: 'Рекомендации модели',
    yourAnswerLabel: 'Ваш ответ',
    referenceLabel: 'Эталонный диагноз',
    emptyValue: '—',
    versionTag: 'МедМентор-RAG v0.5',
    eyebrowReviewLabel: 'Разбор задачи',
} as const

type ScoreKey = Exclude<keyof Score, 'createdAt'>
type NotesKey = keyof CriterionNotes

interface CriterionEntry {
    key: ScoreKey
    label: string
    value: number
    note: string | null
}

interface CriterionDef {
    label: string
    scoreKey: ScoreKey
    notesKey: NotesKey
}

const CRITERIA: CriterionDef[] = [
    {label: 'Сбор анамнеза', scoreKey: 'thoroughness', notesKey: 'thoroughness'},
    {label: 'Логика рассуждения', scoreKey: 'questioningStructure', notesKey: 'questioningStructure'},
    {label: 'Эмпатия', scoreKey: 'empathy', notesKey: 'empathy'},
    {label: 'Вежливость', scoreKey: 'politeness', notesKey: 'politeness'},
    {label: 'Точность диагноза', scoreKey: 'diagnosisCorrect', notesKey: 'correctDiagnosis'},
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
    return CRITERIA.map(({label, scoreKey, notesKey}) => {
        const raw = score[scoreKey]
        const percent = typeof raw === 'number' && Number.isFinite(raw)
            ? Math.round(raw * 100)
            : 0
        return {
            key: scoreKey,
            label,
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
        COPY.eyebrowReviewLabel,
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
        pageError.value = 'Некорректный ID сессии. Вернитесь к списку кейсов.'
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
        pageError.value = 'Сессия не найдена или недоступна. Вернитесь к списку кейсов.'
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
        pageError.value = 'Не удалось начать новый кейс. Попробуйте снова.'
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
            class="mx-auto flex w-full max-w-[64rem] flex-col gap-[1.6rem] px-[2.4rem] py-[6.4rem]"
        >
            <VAlert
                status="error"
                :title="COPY.sessionUnavailableTitle"
                :description="pageError"
            />
            <div>
                <VButton
                    variant="secondary"
                    @click="handleBackToCases"
                >
                    {{ COPY.backToCasesButton }}
                </VButton>
            </div>
        </div>

        <template v-else-if="session && isAbandoned">
            <section
                class="flex flex-1 items-center justify-center bg-gradient-to-b from-[color:var(--color-bg)] to-[color:var(--color-teal-ghost)] px-[2.4rem]"
            >
                <div
                    class="w-full max-w-[48rem] rounded-[1.4rem] border border-[color:var(--color-line-2)] bg-white p-[3.6rem] shadow-card"
                >
                    <p class="text-eyebrow text-[color:var(--color-danger-bright)]">
                        {{ COPY.abandonedEyebrowPrefix }}{{ session.id }}
                    </p>
                    <h1 class="mt-[1rem] font-serif text-[2.8rem] font-medium leading-[1.15] tracking-[-0.02em] text-text-primary">
                        {{ COPY.abandonedTitle }}
                    </h1>
                    <p class="mt-[1rem] text-[1.4rem] leading-[1.55] text-text-secondary">
                        {{ COPY.abandonedDescription }}
                    </p>
                    <div class="mt-[2.4rem] flex flex-wrap gap-[1rem]">
                        <VButton
                            shape="rect"
                            :loading="isRestartPending"
                            @click="handleRestart"
                        >
                            {{ COPY.restartButton }}
                        </VButton>
                        <VButton
                            variant="secondary"
                            shape="rect"
                            :disabled="isRestartPending"
                            @click="handleBackToCases"
                        >
                            {{ COPY.backToCasesButton }}
                        </VButton>
                    </div>
                </div>
            </section>
        </template>

        <template v-else-if="session && isCompleted">
            <section
                class="border-b border-[color:var(--color-line)] bg-gradient-to-b from-[color:var(--color-teal-ghost)] to-[color:var(--color-bg)] px-[2.8rem] py-[2.8rem]"
            >
                <div class="mx-auto w-full max-w-[96rem]">
                    <div class="mb-[1.6rem] flex flex-wrap items-baseline justify-between gap-[2rem]">
                        <p class="text-eyebrow text-brand">{{ eyebrow }}</p>
                        <VButton
                            variant="secondary"
                            shape="rect"
                            size="sm"
                            :loading="isRestartPending"
                            @click="handleRestart"
                        >
                            {{ COPY.restartButton }}
                        </VButton>
                    </div>
                    <div class="flex flex-wrap items-center gap-[2.8rem]">
                        <div class="min-w-0 flex-1">
                            <h1 class="font-serif text-[3rem] font-medium leading-[1.15] tracking-[-0.025em] text-text-primary">
                                {{ COPY.completedTitleLead }} <em class="italic text-brand">{{
                                    COPY.completedTitleAccent
                                }}</em>
                            </h1>
                            <p class="mt-[0.4rem] max-w-[56rem] text-[1.3rem] leading-[1.55] text-text-secondary">
                                {{ COPY.completedDescription }}
                            </p>
                        </div>
                        <ResultScoreRing :score="overallScore"/>
                    </div>
                </div>
            </section>

            <section class="mx-auto w-full max-w-[96rem] px-[2.8rem] py-[2.4rem] pb-[3.6rem]">
                <ResultSectionTitle>{{ COPY.sectionDiagnosisCompare }}</ResultSectionTitle>
                <div class="mb-[2.4rem] grid grid-cols-1 gap-[1.2rem] sm:grid-cols-2">
                    <ResultDiagnosisCard
                        :label="COPY.yourAnswerLabel"
                        :text="session.selectedDiagnosis ?? COPY.emptyValue"
                        :confidence="session.selectedDiagnosisConfidence"
                        :variant="studentDiagnosisMatches ? 'student-match' : 'student-miss'"
                    />
                    <ResultDiagnosisCard
                        :label="COPY.referenceLabel"
                        :text="session.correctDiagnosis ?? COPY.emptyValue"
                        variant="reference"
                    />
                </div>

                <ResultSectionTitle>{{ COPY.sectionCriteria }}</ResultSectionTitle>
                <div class="mb-[2.4rem] rounded-[1.2rem] border border-[color:var(--color-line)] bg-white p-[0.4rem]">
                    <ResultCriterionRow
                        v-for="(item, index) in criteria"
                        :key="item.key"
                        :label="item.label"
                        :note="item.note"
                        :value="item.value"
                        :is-last="index === criteria.length - 1"
                    />
                </div>

                <template v-if="session.result?.keyTurns?.length">
                    <ResultSectionTitle>{{ COPY.sectionKeyTurns }}</ResultSectionTitle>
                    <div
                        class="mb-[2.4rem] rounded-[1.2rem] border border-[color:var(--color-line)] bg-white py-[0.4rem]"
                    >
                        <ResultKeyTurnRow
                            v-for="(turn, index) in session.result.keyTurns"
                            :key="`${turn.turn}-${index}`"
                            :turn="turn"
                            :is-last="index === (session.result?.keyTurns.length ?? 0) - 1"
                        />
                    </div>
                </template>

                <template v-if="session.result?.missedFindings?.length">
                    <ResultSectionTitle>{{ COPY.sectionMissed }}</ResultSectionTitle>
                    <div
                        class="mb-[2.4rem] rounded-[1.2rem] border border-[color:var(--color-line)] bg-white px-[1.8rem] py-[1.4rem]"
                    >
                        <ul class="m-0 list-disc space-y-[0.4rem] pl-[1.8rem] text-[1.35rem] leading-[1.65] text-text-primary">
                            <li
                                v-for="(item, index) in session.result.missedFindings"
                                :key="index"
                            >
                                {{ item }}
                            </li>
                        </ul>
                    </div>
                </template>

                <template v-if="session.result?.summary">
                    <ResultSectionTitle>{{ COPY.sectionRecommendations }}</ResultSectionTitle>
                    <div
                        class="mb-[1.6rem] rounded-[1.2rem] border border-[color:rgb(13_115_119_/_0.2)] bg-gradient-to-br from-[color:var(--color-teal-ghost)] to-[color:var(--color-teal-soft)] px-[1.8rem] py-[1.6rem]"
                    >
                        <p class="font-serif text-[1.55rem] italic leading-[1.5] text-text-primary">
                            «{{ session.result.summary }}»
                        </p>
                        <p class="mt-[1rem] font-mono text-[1.05rem] font-semibold tracking-[0.1em] text-[color:var(--color-teal-deep)]">
                            {{ COPY.versionTag }}
                        </p>
                    </div>
                </template>

                <div class="flex flex-wrap justify-end gap-[1rem]">
                    <VButton
                        variant="secondary"
                        shape="rect"
                        :loading="isRestartPending"
                        @click="handleRestart"
                    >
                        {{ COPY.restartButton }}
                    </VButton>
                    <VButton
                        shape="rect"
                        @click="handleBackToCases"
                    >
                        {{ COPY.backToCasesButton }}
                        <template #trailing>
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 12 12"
                            >
                                <path
                                    d="M2 6h8M7 3l3 3-3 3"
                                    stroke="currentColor"
                                    stroke-width="1.4"
                                    fill="none"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                            </svg>
                        </template>
                    </VButton>
                </div>
            </section>
        </template>
    </div>
</template>
