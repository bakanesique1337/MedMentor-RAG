<script setup lang="ts">
import { computed } from 'vue'

const COPY = {
    wordmark: 'MedMentor',
    accent: 'RAG',
    logoAlt: 'MedMentor RAG',
} as const

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

const wordColor = computed(() => {
    if (props.variant === 'dark') return 'var(--color-white)'
    return 'var(--color-ink)'
})

const accentColor = computed(() => {
    if (props.variant === 'dark') return 'var(--color-mint)'
    return 'var(--brand-primary)'
})
</script>

<template>
    <div class="inline-flex items-center gap-[1rem]">
        <!-- Источник 64px используется на любом размере до 32 без потерь:
             1x браузеры даунсемплят, на 2x retina пиксели идеально совпадают. -->
        <img
            src="/MM1_64.png"
            :alt="COPY.logoAlt"
            :width="size"
            :height="size"
            :style="{ width: `${size}px`, height: `${size}px` }"
            class="block shrink-0 rounded-[25%] object-contain"
        >
        <div
            v-if="showWordmark"
            class="font-serif text-[1.8rem] leading-none font-medium tracking-[-0.02em]"
            :style="{ color: wordColor }"
        >
            {{ COPY.wordmark }}
            <span
                class="italic"
                :style="{ color: accentColor }"
            >{{ COPY.accent }}</span>
        </div>
    </div>
</template>
