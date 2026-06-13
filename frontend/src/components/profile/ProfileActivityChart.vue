<script setup lang="ts">
import {computed} from 'vue'

import type {DayActivity} from '@/utils/profileAggregations'

const COPY = {
    eyebrow: 'Активность за 30 дней',
    minutesSuffix: 'мин.',
    timelineStart: '30 дн. назад',
    timelineMiddle: '15 дн.',
    timelineEnd: 'сегодня',
} as const

interface Props {
    data: DayActivity[]
}

const props = defineProps<Props>()

const totalMinutes = computed<number>(() => props.data.reduce((sum, d) => sum + d.minutes, 0))

const maxMinutes = computed<number>(() => Math.max(...props.data.map((d) => d.minutes), 1))

interface Bar {
    key: string;
    heightPct: number;
    isEmpty: boolean;
    isToday: boolean;
    title: string;
}

const bars = computed<Bar[]>(() => {
    const lastIndex = props.data.length - 1
    return props.data.map((day, i) => {
        const ratio = day.minutes / maxMinutes.value
        const heightPct = day.minutes > 0 ? Math.max(6, ratio * 100) : 0
        return {
            key: `${day.date.getTime()}-${i}`,
            heightPct,
            isEmpty: day.minutes === 0,
            isToday: i === lastIndex,
            title: `${day.date.toLocaleDateString('ru')}: ${day.minutes} ${COPY.minutesSuffix}`,
        }
    })
})
</script>

<template>
    <div class="rounded-lg border border-(--color-line) bg-white px-8 pb-[1.6rem] pt-[1.8rem]">
        <div class="mb-[1.8rem] flex items-end justify-between gap-[1.6rem]">
            <div class="min-w-0">
                <p class="mb-[0.6rem] text-eyebrow text-text-tertiary">
                    {{ COPY.eyebrow }}
                </p>
                <p class="font-serif text-[2.8rem] font-medium leading-none tracking-[-0.02em] text-text-primary">
                    {{ totalMinutes }}
                    <span class="ml-[0.6rem] text-[1.4rem] font-normal text-text-tertiary">
                        {{ COPY.minutesSuffix }}
                    </span>
                </p>
            </div>
        </div>

        <div class="flex h-36 items-end gap-[0.2rem]">
            <div
                v-for="bar in bars"
                :key="bar.key"
                class="relative flex h-full flex-1 flex-col justify-end"
                :title="bar.title"
            >
                <div
                    v-if="bar.isEmpty"
                    class="h-[0.2rem] rounded-[0.1rem] bg-[rgb(13_115_119/0.18)]"
                />
                <div
                    v-else
                    class="rounded-t-[0.3rem]"
                    :style="{
                        height: `${bar.heightPct}%`,
                        background: bar.isToday ? 'var(--color-ink)' : 'var(--brand-primary)',
                    }"
                />
            </div>
        </div>

        <div class="mt-[0.8rem] flex justify-between font-mono text-[1rem] text-text-tertiary">
            <span>{{ COPY.timelineStart }}</span>
            <span>{{ COPY.timelineMiddle }}</span>
            <span>{{ COPY.timelineEnd }}</span>
        </div>
    </div>
</template>
