<script setup lang="ts">
import { computed } from 'vue'
import { DIFFICULTY_PRESETS, type DifficultyLevel } from '@/types'

interface Props {
    level: DifficultyLevel
    showLabel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    showLabel: true,
})

interface PillStyle {
    bgClass: string
    fgClass: string
}

const PILL_STYLES: Record<DifficultyLevel, PillStyle> = {
    easy: {
        bgClass: 'bg-brand-ghost',
        fgClass: 'text-brand',
    },
    medium: {
        bgClass: 'bg-[color:var(--color-amber-soft)]',
        fgClass: 'text-[color:var(--color-amber-text)]',
    },
    hard: {
        bgClass: 'bg-[color:var(--color-rose-soft)]',
        fgClass: 'text-[color:var(--color-rose-text)]',
    },
}

const preset = computed(() => DIFFICULTY_PRESETS[props.level])
const pill = computed(() => PILL_STYLES[props.level])

const DOT_KEYS = ['dot-1', 'dot-2', 'dot-3'] as const
</script>

<template>
    <span
        class="inline-flex items-center gap-[0.6rem] rounded-[0.4rem] px-[0.8rem] py-[0.3rem] text-eyebrow-sm"
        :class="[pill.bgClass, pill.fgClass]"
    >
        <span class="flex gap-[0.2rem]">
            <span
                v-for="(key, index) in DOT_KEYS"
                :key="key"
                class="h-[0.4rem] w-[0.4rem] rounded-[0.1rem]"
                :class="[index < preset.dotCount ? 'bg-current opacity-100' : 'bg-current opacity-25']"
            />
        </span>
        <span v-if="showLabel">{{ preset.label }}</span>
    </span>
</template>
