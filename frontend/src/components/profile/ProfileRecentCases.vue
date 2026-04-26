<script setup lang="ts">
import { computed } from 'vue'

import { categoryDisplayLabel } from '@/constants/caseCategories'
import type { HistorySession } from '@/types'

const COPY = {
    eyebrow: 'Последние кейсы',
    openAllLink: 'Все кейсы',
    scoreOutOf: '/100',
} as const

const SCORE_HIGH_THRESHOLD = 85
const SCORE_MID_THRESHOLD = 70

interface Props {
    items: HistorySession[]
    limit?: number
}

const props = withDefaults(defineProps<Props>(), {
    limit: 6,
})

const emit = defineEmits<{
    open: [sessionId: number]
    openAll: []
}>()

interface RowVm {
    id: number;
    score: number;
    scoreColor: string;
    scoreBg: string;
    scoreLabel: string;
    title: string;
    category: string;
    patient: string;
    date: string;
}

const dateFormatter = new Intl.DateTimeFormat('ru', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
})

const SCORE_TONE_COLOR: Record<'high' | 'mid' | 'low', string> = {
    high: 'var(--brand-primary)',
    mid: '#b38720',
    low: 'var(--color-danger)',
}

const SCORE_TONE_BG: Record<'high' | 'mid' | 'low', string> = {
    high: 'rgb(13 115 119 / 0.08)',
    mid: 'rgb(179 135 32 / 0.1)',
    low: 'rgb(138 46 32 / 0.08)',
}

const SCORE_TONE_LABEL: Record<'high' | 'mid' | 'low', string> = {
    high: 'Отлично',
    mid: 'Хорошо',
    low: 'Требует разбора',
}

function toneFor(score: number): 'high' | 'mid' | 'low' {
    if (score >= SCORE_HIGH_THRESHOLD) return 'high'
    if (score >= SCORE_MID_THRESHOLD) return 'mid'
    return 'low'
}

const rows = computed<RowVm[]>(() => {
    return props.items.slice(0, props.limit).map<RowVm>((session) => {
        const total = session.score?.totalScore ?? 0
        const score = Math.round(total * 100)
        const tone = toneFor(score)
        return {
            id: session.id,
            score,
            scoreColor: SCORE_TONE_COLOR[tone],
            scoreBg: SCORE_TONE_BG[tone],
            scoreLabel: SCORE_TONE_LABEL[tone],
            title: session.caseTitle,
            category: categoryDisplayLabel(session.caseCategory),
            patient: session.patientName,
            date: dateFormatter.format(new Date(session.createdAt)),
        }
    })
})

function handleOpen(id: number): void {
    emit('open', id)
}

function handleOpenAll(): void {
    emit('openAll')
}
</script>

<template>
    <div class="rounded-[1.4rem] border border-[color:var(--color-line)] bg-white px-[2.2rem] pb-[1rem] pt-[1.8rem]">
        <div class="mb-[1.6rem] flex items-center justify-between">
            <p class="text-eyebrow text-text-tertiary">
                {{ COPY.eyebrow }}
            </p>
            <button
                type="button"
                class="inline-flex items-center gap-[0.4rem] text-[1.2rem] text-brand transition hover:text-brand-deep"
                @click="handleOpenAll"
            >
                {{ COPY.openAllLink }}
                <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="none"
                    aria-hidden="true"
                >
                    <path
                        d="M2 5h6M5 2l3 3-3 3"
                        stroke="currentColor"
                        stroke-width="1.2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
            </button>
        </div>

        <div>
            <button
                v-for="(row, index) in rows"
                :key="row.id"
                type="button"
                class="flex w-full items-center gap-[2rem] py-[1.6rem] text-left transition hover:bg-[color:rgb(10_31_31_/_0.02)]"
                :class="index === 0 ? '' : 'border-t border-[color:var(--color-line)]'"
                @click="handleOpen(row.id)"
            >
                <div
                    class="flex h-[5.4rem] w-[5.4rem] shrink-0 flex-col items-center justify-center rounded-full"
                    :style="{
                        background: row.scoreBg,
                        border: `0.5px solid ${row.scoreColor}22`,
                    }"
                >
                    <span
                        class="font-serif text-[2.2rem] font-medium leading-none tracking-[-0.02em] tabular"
                        :style="{ color: row.scoreColor }"
                    >{{ row.score }}</span>
                    <span
                        class="mt-[0.1rem] font-mono text-[0.85rem] tracking-[0.06em] opacity-70"
                        :style="{ color: row.scoreColor }"
                    >{{ COPY.scoreOutOf }}</span>
                </div>

                <div class="min-w-0 flex-1">
                    <div class="mb-[0.4rem] flex items-center gap-[1rem]">
                        <span class="text-eyebrow-sm text-brand">
                            {{ row.category }}
                        </span>
                        <span class="h-[0.2rem] w-[0.2rem] rounded-full bg-[color:var(--color-ink-4)]" />
                        <span class="font-mono text-[1.1rem] tracking-[0.03em] text-text-tertiary">
                            {{ row.date }}
                        </span>
                    </div>
                    <p class="mb-[0.3rem] truncate font-serif text-[1.5rem] font-medium leading-[1.35] tracking-[-0.01em] text-text-primary">
                        {{ row.title }}
                    </p>
                    <p class="truncate text-[1.2rem] text-text-tertiary">
                        {{ row.patient }}
                    </p>
                </div>

                <div class="flex shrink-0 items-center gap-[1.4rem]">
                    <span
                        class="text-[1.15rem] font-medium"
                        :style="{ color: row.scoreColor }"
                    >{{ row.scoreLabel }}</span>
                    <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        class="text-[color:var(--color-ink-4)]"
                        aria-hidden="true"
                    >
                        <path
                            d="M4 2l4 4-4 4"
                            stroke="currentColor"
                            stroke-width="1.3"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                    </svg>
                </div>
            </button>
        </div>
    </div>
</template>
