<script setup lang="ts">
import { computed } from 'vue'

const COPY = {
    completed: 'Завершено',
    of: 'из',
    averageScore: 'Ср. балл',
    scoreOutOf: '/100',
    fallbackAverage: '0',
} as const

interface Props {
    completedCount: number
    totalCount: number
    averageTotalScore: number | null
}

const props = defineProps<Props>()

const completedDisplay = computed<string>(() => String(props.completedCount))
const totalDisplay = computed<string>(() => `${COPY.of} ${props.totalCount}`)

const averageDisplay = computed<string>(() => {
    if (props.averageTotalScore === null || props.averageTotalScore === undefined) {
        return COPY.fallbackAverage
    }
    return String(Math.round(props.averageTotalScore * 100))
})
</script>

<template>
    <div class="flex gap-[1rem]">
        <div
            class="min-w-[9.6rem] rounded-[1rem] border border-[color:rgb(13_115_119_/_0.18)] bg-white/60 px-[1.4rem] py-[1rem] backdrop-blur-[6px]"
        >
            <p class="mb-[0.4rem] font-mono text-[0.95rem] font-semibold uppercase tracking-[0.12em] text-text-secondary">
                {{ COPY.completed }}
            </p>
            <div class="flex items-baseline gap-[0.4rem]">
                <span class="font-serif text-[2.4rem] font-medium leading-none text-text-primary tabular">
                    {{ completedDisplay }}
                </span>
                <span class="text-[1.1rem] text-text-tertiary">{{ totalDisplay }}</span>
            </div>
        </div>

        <div
            class="min-w-[9.6rem] rounded-[1rem] border border-[color:rgb(13_115_119_/_0.18)] bg-white/60 px-[1.4rem] py-[1rem] backdrop-blur-[6px]"
        >
            <p class="mb-[0.4rem] font-mono text-[0.95rem] font-semibold uppercase tracking-[0.12em] text-text-secondary">
                {{ COPY.averageScore }}
            </p>
            <div class="flex items-baseline gap-[0.4rem]">
                <span class="font-serif text-[2.4rem] font-medium leading-none text-text-primary tabular">
                    {{ averageDisplay }}
                </span>
                <span class="text-[1.1rem] text-text-tertiary">{{ COPY.scoreOutOf }}</span>
            </div>
        </div>
    </div>
</template>
