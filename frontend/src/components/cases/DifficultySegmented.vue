<script setup lang="ts">
import { computed } from 'vue'
import {
    ALL_DIFFICULTIES,
    DIFFICULTY,
    DIFFICULTY_PRESETS,
    type DifficultyFilterValue,
    type DifficultyLevel,
} from '@/types'

interface Props {
    modelValue: DifficultyFilterValue
}

defineProps<Props>()

const emit = defineEmits<{
    'update:modelValue': [value: DifficultyFilterValue]
}>()

interface FilterDef {
    key: DifficultyFilterValue
    label: string
    dotCount: 0 | 1 | 2 | 3
    accentClass: string
}

const ALL_FILTER_LABEL = 'Все уровни'

const LEVEL_ACCENTS: Record<DifficultyLevel, string> = {
    easy: 'text-brand',
    medium: 'text-[color:var(--color-amber)]',
    hard: 'text-[color:var(--color-danger)]',
}

const FILTERS: FilterDef[] = [
    { key: ALL_DIFFICULTIES, label: ALL_FILTER_LABEL, dotCount: 0, accentClass: '' },
    { key: DIFFICULTY.EASY, ...DIFFICULTY_PRESETS.easy, accentClass: LEVEL_ACCENTS.easy },
    { key: DIFFICULTY.MEDIUM, ...DIFFICULTY_PRESETS.medium, accentClass: LEVEL_ACCENTS.medium },
    { key: DIFFICULTY.HARD, ...DIFFICULTY_PRESETS.hard, accentClass: LEVEL_ACCENTS.hard },
]

const DOT_KEYS = computed(() => [0, 1, 2])

/**
 * Emits the chosen filter value upward.
 */
function handleSelect(value: DifficultyFilterValue): void {
    emit('update:modelValue', value)
}
</script>

<template>
    <div class="inline-flex rounded-[0.8rem] border border-[color:var(--color-line-2)] bg-white p-[0.3rem]">
        <button
            v-for="filter in FILTERS"
            :key="filter.key"
            type="button"
            class="flex items-center gap-[0.6rem] whitespace-nowrap rounded-[0.6rem] px-[1.2rem] py-[0.5rem] text-[1.25rem] transition-colors duration-150"
            :class="modelValue === filter.key
                ? 'bg-surface-base font-medium text-text-primary'
                : 'text-text-secondary hover:text-text-primary'"
            @click="handleSelect(filter.key)"
        >
            <span
                v-if="filter.dotCount > 0"
                class="flex gap-[0.2rem]"
                :class="filter.accentClass"
            >
                <span
                    v-for="index in DOT_KEYS"
                    :key="`dot-${filter.key}-${index}`"
                    class="block h-[0.4rem] w-[0.4rem] rounded-[0.1rem] bg-current"
                    :style="{ opacity: index < filter.dotCount ? 1 : 0.2 }"
                />
            </span>
            <span>{{ filter.label }}</span>
        </button>
    </div>
</template>
