<script setup lang="ts">
import { computed } from 'vue'

import { VSelect } from '@/components/ui'
import type { SelectOption } from '@/components/ui'

interface Props {
    categories: string[]
    difficulties: string[]
    category: string
    difficulty: string
}

const emit = defineEmits<{
    'update:category': [value: string]
    'update:difficulty': [value: string]
}>()

const props = defineProps<Props>()

/**
 * Category options with an "All" sentinel at the top.
 */
const categoryOptions = computed<SelectOption[]>(() => [
    { label: 'All categories', value: '' },
    ...props.categories.map((c) => ({ label: c, value: c })),
])

/**
 * Difficulty options with an "All" sentinel at the top.
 */
const difficultyOptions = computed<SelectOption[]>(() => [
    { label: 'All difficulties', value: '' },
    ...props.difficulties.map((d) => ({ label: d, value: d })),
])
</script>

<template>
    <div class="flex flex-wrap gap-3">
        <VSelect
            :model-value="category"
            :options="categoryOptions"
            class="min-w-[18rem]"
            @update:model-value="emit('update:category', String($event))"
        />
        <VSelect
            :model-value="difficulty"
            :options="difficultyOptions"
            class="min-w-[18rem]"
            @update:model-value="emit('update:difficulty', String($event))"
        />
    </div>
</template>
