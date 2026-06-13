<script setup lang="ts">
import {computed} from 'vue'

import {usePluralize} from '@/composables/shared/usePluralize'
import type {AccuracyBuckets} from '@/utils/profileAggregations'

const COPY = {
    eyebrow: 'Точность диагностики',
    totalLeading: 'ВСЕГО',
    totalTrailingForms: ['ЗАДАЧА', 'ЗАДАЧИ', 'ЗАДАЧ'],
    centerCaption: 'ВЕРНЫХ · %',
    legendCorrect: 'Верный диагноз',
    legendPartial: 'Частично верный',
    legendWrong: 'Ошибочный диагноз',
} as const

interface Props {
    buckets: AccuracyBuckets
}

const props = defineProps<Props>()

const totalTrailing = usePluralize(() => props.buckets.total, COPY.totalTrailingForms)

const RADIUS = 62
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

interface Segment {
    correct: number;
    partial: number;
    wrong: number;
    correctOffset: number;
    partialOffset: number;
    wrongOffset: number;
}

const segments = computed<Segment>(() => {
    const total = Math.max(props.buckets.total, 1)
    const correct = (props.buckets.correct / total) * CIRCUMFERENCE
    const partial = (props.buckets.partial / total) * CIRCUMFERENCE
    const wrong = (props.buckets.wrong / total) * CIRCUMFERENCE

    return {
        correct,
        partial,
        wrong,
        correctOffset: 0,
        partialOffset: -correct,
        wrongOffset: -(correct + partial),
    }
})

const correctPct = computed<number>(() => {
    if (props.buckets.total === 0) return 0
    return Math.round((props.buckets.correct / props.buckets.total) * 100)
})

const partialPct = computed<number>(() => {
    if (props.buckets.total === 0) return 0
    return Math.round((props.buckets.partial / props.buckets.total) * 100)
})

const wrongPct = computed<number>(() => {
    if (props.buckets.total === 0) return 0
    return Math.round((props.buckets.wrong / props.buckets.total) * 100)
})

interface LegendItem {
    color: string;
    label: string;
    count: number;
    pct: number;
}

const legend = computed<LegendItem[]>(() => [
    {color: 'var(--brand-primary)', label: COPY.legendCorrect, count: props.buckets.correct, pct: correctPct.value},
    {color: '#e8b54a', label: COPY.legendPartial, count: props.buckets.partial, pct: partialPct.value},
    {color: '#c77566', label: COPY.legendWrong, count: props.buckets.wrong, pct: wrongPct.value},
])

const dashArrayCorrect = computed<string>(() => `${segments.value.correct} ${CIRCUMFERENCE}`)
const dashArrayPartial = computed<string>(() => `${segments.value.partial} ${CIRCUMFERENCE}`)
const dashArrayWrong = computed<string>(() => `${segments.value.wrong} ${CIRCUMFERENCE}`)
</script>

<template>
    <div class="flex flex-col rounded-[1.4rem] border border-[color:var(--color-line)] bg-white px-[2rem] py-[1.8rem]">
        <div class="mb-[2rem] flex flex-wrap items-center justify-between gap-[1.2rem]">
            <p class="text-eyebrow text-text-tertiary">
                {{ COPY.eyebrow }}
            </p>
            <p class="font-mono text-[1.05rem] tracking-[0.04em] text-text-tertiary">
                {{ COPY.totalLeading }}
                <span class="ml-[0.4rem] font-medium text-text-primary">{{ buckets.total }}</span>
                {{ totalTrailing }}
            </p>
        </div>

        <div class="flex flex-1 flex-wrap items-center gap-[2.8rem]">
            <svg
                width="160"
                height="160"
                viewBox="0 0 160 160"
                class="shrink-0"
                aria-hidden="true"
            >
                <circle
                    cx="80"
                    cy="80"
                    :r="RADIUS"
                    fill="none"
                    stroke="rgb(10 31 31 / 0.06)"
                    stroke-width="14"
                />
                <circle
                    cx="80"
                    cy="80"
                    :r="RADIUS"
                    fill="none"
                    stroke="var(--brand-primary)"
                    stroke-width="14"
                    :stroke-dasharray="dashArrayCorrect"
                    :stroke-dashoffset="segments.correctOffset"
                    transform="rotate(-90 80 80)"
                    stroke-linecap="butt"
                />
                <circle
                    cx="80"
                    cy="80"
                    :r="RADIUS"
                    fill="none"
                    stroke="#e8b54a"
                    stroke-width="14"
                    :stroke-dasharray="dashArrayPartial"
                    :stroke-dashoffset="segments.partialOffset"
                    transform="rotate(-90 80 80)"
                    stroke-linecap="butt"
                />
                <circle
                    cx="80"
                    cy="80"
                    :r="RADIUS"
                    fill="none"
                    stroke="#c77566"
                    stroke-width="14"
                    :stroke-dasharray="dashArrayWrong"
                    :stroke-dashoffset="segments.wrongOffset"
                    transform="rotate(-90 80 80)"
                    stroke-linecap="butt"
                />
                <text
                    x="80"
                    y="78"
                    text-anchor="middle"
                    font-family="Fraunces, Georgia, serif"
                    font-size="40"
                    font-weight="500"
                    letter-spacing="-1"
                    fill="var(--color-ink)"
                >
                    {{ correctPct }}
                </text>
                <text
                    x="80"
                    y="98"
                    text-anchor="middle"
                    font-family="Geist Mono, ui-monospace, monospace"
                    font-size="9.5"
                    letter-spacing="1.3"
                    fill="var(--color-ink-3)"
                >{{ COPY.centerCaption }}
                </text>
            </svg>

            <div class="flex min-w-0 flex-1 flex-col gap-[1.6rem]">
                <div
                    v-for="item in legend"
                    :key="item.label"
                >
                    <div class="mb-[0.6rem] flex items-baseline justify-between gap-[1.2rem]">
                        <div class="flex min-w-0 items-center gap-[0.8rem]">
                            <span
                                class="h-[0.8rem] w-[0.8rem] shrink-0 rounded-[0.2rem]"
                                :style="{ background: item.color }"
                            />
                            <span class="truncate text-[1.25rem] font-medium text-text-primary">
                                {{ item.label }}
                            </span>
                        </div>
                        <div class="whitespace-nowrap font-mono text-[1.15rem] tabular text-text-tertiary">
                            <span class="font-medium text-text-primary">{{ item.count }}</span>
                            <span class="mx-[0.5rem] text-[color:var(--color-ink-4)]">·</span>
                            <span>{{ item.pct }}%</span>
                        </div>
                    </div>
                    <div class="relative h-[0.3rem] overflow-hidden rounded-[0.2rem] bg-[color:rgb(10_31_31_/_0.05)]">
                        <div
                            class="absolute inset-y-0 left-0 rounded-[0.2rem]"
                            :style="{ width: `${item.pct}%`, background: item.color }"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
