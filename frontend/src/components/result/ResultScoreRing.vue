<script setup lang="ts">
import { computed } from 'vue'

const COPY = {
    outOfLabel: 'ИЗ 100',
} as const

interface Props {
    score: number
}

const props = defineProps<Props>()

const RADIUS = 36
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const clampedScore = computed(() => Math.max(0, Math.min(100, props.score)))

const dashOffset = computed(() => CIRCUMFERENCE * (1 - clampedScore.value / 100))

const stroke = computed(() => {
    if (clampedScore.value >= 80) return 'var(--color-teal)'
    if (clampedScore.value >= 60) return 'var(--color-amber)'
    return 'var(--color-danger-bright)'
})
</script>

<template>
    <div class="relative h-[9.6rem] w-[9.6rem] shrink-0">
        <svg
            class="-rotate-90"
            width="96"
            height="96"
        >
            <circle
                cx="48"
                cy="48"
                :r="RADIUS"
                fill="none"
                stroke="rgb(10 31 31 / 0.08)"
                stroke-width="5"
            />
            <circle
                cx="48"
                cy="48"
                :r="RADIUS"
                fill="none"
                :stroke="stroke"
                stroke-width="5"
                stroke-linecap="round"
                :stroke-dasharray="CIRCUMFERENCE"
                :stroke-dashoffset="dashOffset"
                class="ring-progress"
            />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="font-serif text-[2.6rem] font-medium leading-none text-text-primary tabular">
                {{ clampedScore }}
            </span>
            <span class="mt-[0.3rem] font-mono text-[0.85rem] font-semibold tracking-[0.14em] text-text-secondary">
                {{ COPY.outOfLabel }}
            </span>
        </div>
    </div>
</template>

<style scoped>
.ring-progress {
    transition: stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1);
}
</style>
