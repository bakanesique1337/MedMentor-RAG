<script setup lang="ts">
import { computed } from 'vue'

export type DifficultyFilterValue = 'all' | 'easy' | 'medium' | 'hard'

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
    pips: number
    accentClass: string
}

const FILTERS: FilterDef[] = [
    { key: 'all', label: 'Все уровни', pips: 0, accentClass: '' },
    { key: 'easy', label: 'Лёгкий', pips: 1, accentClass: 'text-brand' },
    { key: 'medium', label: 'Средний', pips: 2, accentClass: 'text-[color:var(--color-amber)]' },
    { key: 'hard', label: 'Сложный', pips: 3, accentClass: 'text-[color:var(--color-danger)]' },
]

const PIP_KEYS = computed(() => [0, 1, 2])

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
                v-if="filter.pips > 0"
                class="flex gap-[0.2rem]"
                :class="filter.accentClass"
            >
                <span
                    v-for="index in PIP_KEYS"
                    :key="`pip-${filter.key}-${index}`"
                    class="block h-[0.4rem] w-[0.4rem] rounded-[0.1rem] bg-current"
                    :style="{ opacity: index < filter.pips ? 1 : 0.2 }"
                />
            </span>
            <span>{{ filter.label }}</span>
        </button>
    </div>
</template>
