<script setup lang="ts">
import { computed } from 'vue'

import { VSelect } from '@/components/ui'
import type { SelectOption } from '@/components/ui/VSelect.vue'

interface Props {
    categories: string[]
    difficulties: string[]
    category: string
    difficulty: string
    query?: string
}

const emit = defineEmits<{
    'update:category': [value: string]
    'update:difficulty': [value: string]
    'update:query': [value: string]
}>()

const props = withDefaults(defineProps<Props>(), {
    query: '',
})

const categoryOptions = computed<SelectOption[]>(() => [
    { label: 'Все специальности', value: '' },
    ...props.categories.map((c) => ({ label: c, value: c })),
])

const difficultyOptions = computed<SelectOption[]>(() => [
    { label: 'Любая сложность', value: '' },
    ...props.difficulties.map((d) => ({ label: d, value: d })),
])

function handleSearchInput(event: Event): void {
    const target = event.target
    if (target instanceof HTMLInputElement) {
        emit('update:query', target.value)
    }
}
</script>

<template>
    <div class="flex flex-wrap items-center gap-[1.2rem]">
        <label class="relative flex h-[4rem] min-w-[28rem] flex-1 items-center gap-[0.8rem] rounded-[1rem] border border-[color:var(--color-line-2)] bg-white px-[1.4rem] focus-within:border-brand">
            <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                class="text-text-tertiary"
            >
                <circle
                    cx="6"
                    cy="6"
                    r="4"
                    stroke="currentColor"
                    stroke-width="1.3"
                />
                <path
                    d="M9.5 9.5L12 12"
                    stroke="currentColor"
                    stroke-width="1.3"
                    stroke-linecap="round"
                />
            </svg>
            <input
                :value="query"
                type="search"
                placeholder="Поиск по жалобе, диагнозу, пациенту…"
                class="min-w-0 flex-1 border-0 bg-transparent p-0 text-[1.35rem] text-text-primary outline-none placeholder:text-text-tertiary"
                @input="handleSearchInput"
            />
        </label>

        <VSelect
            :model-value="category"
            :options="categoryOptions"
            class="min-w-[18rem]"
            @update:model-value="(val: string) => emit('update:category', val)"
        />
        <VSelect
            :model-value="difficulty"
            :options="difficultyOptions"
            class="min-w-[18rem]"
            @update:model-value="(val: string) => emit('update:difficulty', val)"
        />
    </div>
</template>
