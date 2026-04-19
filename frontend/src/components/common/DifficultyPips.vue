<script setup lang="ts">
import { computed } from 'vue'

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'easy' | 'medium' | 'hard' | string

interface Props {
    level: Difficulty
    showLabel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    showLabel: true,
})

interface Preset {
    label: string
    pips: number
    bgClass: string
    fgClass: string
}

const PRESETS: Record<'easy' | 'medium' | 'hard', Preset> = {
    easy: {
        label: 'Лёгкий',
        pips: 1,
        bgClass: 'bg-brand-ghost',
        fgClass: 'text-brand',
    },
    medium: {
        label: 'Средний',
        pips: 2,
        bgClass: 'bg-[color:var(--color-amber-soft)]',
        fgClass: 'text-[color:var(--color-amber-text)]',
    },
    hard: {
        label: 'Сложный',
        pips: 3,
        bgClass: 'bg-[color:var(--color-rose-soft)]',
        fgClass: 'text-[color:var(--color-rose-text)]',
    },
}

const preset = computed<Preset>(() => {
    const key = String(props.level).toLowerCase()
    if (key === 'easy') return PRESETS.easy
    if (key === 'medium') return PRESETS.medium
    if (key === 'hard') return PRESETS.hard
    return PRESETS.easy
})

const PIP_KEYS = ['pip-1', 'pip-2', 'pip-3'] as const
</script>

<template>
    <span
        class="inline-flex items-center gap-[0.6rem] rounded-[0.4rem] px-[0.8rem] py-[0.3rem] text-eyebrow-sm"
        :class="[preset.bgClass, preset.fgClass]"
    >
        <span class="flex gap-[0.2rem]">
            <span
                v-for="(key, index) in PIP_KEYS"
                :key="key"
                class="h-[0.4rem] w-[0.4rem] rounded-[0.1rem]"
                :class="[index < preset.pips ? 'bg-current opacity-100' : 'bg-current opacity-25']"
            />
        </span>
        <span v-if="showLabel">{{ preset.label }}</span>
    </span>
</template>
