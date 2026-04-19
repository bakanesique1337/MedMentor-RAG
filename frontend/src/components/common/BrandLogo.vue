<script setup lang="ts">
import { computed } from 'vue'

type BrandVariant = 'light' | 'dark' | 'compact'

interface Props {
    variant?: BrandVariant
    size?: number
    showWordmark?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    variant: 'light',
    size: 28,
    showWordmark: true,
})

const markColor = computed(() => {
    if (props.variant === 'dark') return 'var(--color-mint)'
    return 'var(--brand-primary)'
})

const wordColor = computed(() => {
    if (props.variant === 'dark') return 'var(--color-white)'
    return 'var(--color-ink)'
})

const accentColor = computed(() => {
    if (props.variant === 'dark') return 'var(--color-mint)'
    return 'var(--brand-primary)'
})

const outlineFill = computed(() => {
    if (props.variant === 'dark') return 'rgba(255,255,255,0.06)'
    return '#fff'
})

const outlineStroke = computed(() => {
    if (props.variant === 'dark') return 'rgba(159,198,194,0.4)'
    return 'rgba(13,115,119,0.35)'
})
</script>

<template>
    <div class="inline-flex items-center gap-[1rem]">
        <svg
            :width="size"
            :height="size"
            viewBox="0 0 40 40"
            fill="none"
            aria-hidden="true"
        >
            <rect
                x="1"
                y="1"
                width="38"
                height="38"
                rx="10"
                :fill="outlineFill"
                :stroke="outlineStroke"
                stroke-width="1"
            />
            <path
                d="M9 27V13l6 10 6-10v14"
                :stroke="markColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <circle
                cx="28"
                cy="16"
                r="3"
                :fill="markColor"
            />
            <path
                d="M28 19v6M25 22h6"
                :stroke="markColor"
                stroke-width="1.8"
                stroke-linecap="round"
            />
        </svg>
        <div
            v-if="showWordmark"
            class="font-serif text-[1.8rem] leading-none font-medium tracking-[-0.02em]"
            :style="{ color: wordColor }"
        >
            MedMentor
            <span
                class="italic"
                :style="{ color: accentColor }"
            >RAG</span>
        </div>
    </div>
</template>
