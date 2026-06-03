<script setup lang="ts">
import { useVModel } from '@vueuse/core'

interface Props {
    modelValue?: boolean
    label?: string
    disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    label: '',
    disabled: false,
})

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
}>()

const model = useVModel(props, 'modelValue', emit)
</script>

<template>
    <label
        class="inline-flex items-center gap-[0.8rem]"
        :class="disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'"
    >
        <span
            class="relative inline-flex size-[1.8rem] shrink-0 items-center justify-center rounded-[0.4rem] border bg-white"
            :class="model ? 'border-brand bg-brand' : 'border-[color:var(--color-line-2)]'"
        >
            <svg
                v-if="model"
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
            ><path
                d="M1.5 5l2.5 2.5L8.5 2.5"
                stroke="white"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
            /></svg>
        </span>
        <input
            v-model="model"
            type="checkbox"
            class="sr-only"
            :disabled="disabled"
        />
        <span
            v-if="label"
            class="text-[1.35rem] text-text-primary"
        >{{ label }}</span>
    </label>
</template>
