<script setup lang="ts">
import { computed } from 'vue'

import type { Result, Score } from '@/types'

const COPY = {
    eyebrow: 'Разбор сессии',
    title: 'Симуляция завершена',
    scoreOutOf: '/ 100',
    modelCommentLabel: 'Комментарий модели',
    emptyValue: '—',
    fallback: 'Данные об оценке недоступны для этой сессии.',
} as const

interface Props {
    score: Score | null
    result: Result | null
    caseTitle: string
}

const props = defineProps<Props>()

type ScoreKey = Exclude<keyof Score, 'createdAt'>

const SCORE_LABELS: Array<[ScoreKey, string]> = [
    ['politeness', 'Вежливость'],
    ['questioningStructure', 'Структура опроса'],
    ['thoroughness', 'Полнота сбора'],
    ['empathy', 'Эмпатия'],
    ['diagnosisCorrect', 'Точность диагноза'],
]

interface Entry {
    key: ScoreKey
    label: string
    value: number | null
    percent: number
}

const entries = computed<Entry[]>(() =>
    SCORE_LABELS.map(([key, label]) => {
        const raw = props.score ? props.score[key] : null
        const percent = raw === null ? 0 : Math.round(raw * 100)
        return { key, label, value: raw, percent }
    }),
)

const total = computed(() => {
    const validValues = entries.value
        .map((e) => e.value)
        .filter((v): v is number => v !== null)
    if (validValues.length === 0) return null
    const avg = validValues.reduce((a, b) => a + b, 0) / validValues.length
    return Math.round(avg * 100)
})
</script>

<template>
    <div class="rounded-[1.4rem] border border-[color:var(--color-line)] bg-white p-[2.4rem] shadow-card">
        <div class="flex flex-wrap items-center justify-between gap-[1.2rem] border-b border-[color:var(--color-line)] pb-[1.6rem]">
            <div>
                <p class="text-eyebrow text-brand">{{ COPY.eyebrow }}</p>
                <h2 class="mt-[0.4rem] font-serif text-[2.4rem] font-medium leading-[1.15] tracking-[-0.02em] text-text-primary">
                    {{ COPY.title }}
                </h2>
                <p class="mt-[0.4rem] text-[1.35rem] text-text-secondary">
                    {{ caseTitle }}
                </p>
            </div>
            <div
                v-if="total !== null"
                class="flex items-baseline gap-[0.4rem]"
            >
                <span class="font-serif text-[4.8rem] font-medium leading-none text-brand tabular">
                    {{ total }}
                </span>
                <span class="text-[1.35rem] text-text-tertiary">{{ COPY.scoreOutOf }}</span>
            </div>
        </div>

        <div
            v-if="score"
            class="mt-[1.8rem] flex flex-col gap-[1rem]"
        >
            <div
                v-for="entry in entries"
                :key="entry.key"
                class="grid grid-cols-[1fr_minmax(12rem,0.6fr)_5rem] items-center gap-[1.2rem]"
            >
                <p class="text-[1.35rem] font-medium text-text-primary">{{ entry.label }}</p>
                <div class="h-[0.5rem] overflow-hidden rounded-[0.25rem] bg-[color:rgb(10_31_31_/_0.06)]">
                    <div
                        class="h-full"
                        :class="entry.percent >= 80 ? 'bg-brand' : entry.percent >= 60 ? 'bg-[color:var(--color-amber)]' : 'bg-[color:var(--color-danger-bright)]'"
                        :style="{ width: `${entry.percent}%` }"
                    />
                </div>
                <p class="text-right font-mono text-[1.2rem] text-text-secondary tabular">
                    {{ entry.value === null ? COPY.emptyValue : entry.percent }}
                </p>
            </div>
        </div>

        <div
            v-if="result"
            class="mt-[2rem] rounded-[1rem] border border-[color:rgb(13_115_119_/_0.2)] bg-brand-ghost p-[1.6rem]"
        >
            <p class="text-eyebrow-sm text-brand-deep">{{ COPY.modelCommentLabel }}</p>
            <p class="mt-[0.8rem] font-serif text-[1.55rem] italic leading-[1.45] text-text-primary">
                &laquo;{{ result.summary }}&raquo;
            </p>
        </div>

        <p
            v-if="!score && !result"
            class="mt-[1.6rem] text-[1.35rem] text-text-secondary"
        >
            {{ COPY.fallback }}
        </p>
    </div>
</template>
