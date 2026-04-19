<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { computed, useAttrs } from 'vue'

import VField from '@/components/ui/VField.vue'
import { cn } from '@/components/ui/utils'

defineOptions({
    inheritAttrs: false,
})

type InputType = 'text' | 'password' | 'email' | 'search' | 'number'
type InputSize = 'sm' | 'md' | 'lg'

interface Props {
    modelValue?: string
    type?: InputType
    size?: InputSize
    id?: string
    label?: string
    hint?: string
    error?: string
    placeholder?: string
    disabled?: boolean
    readonly?: boolean
    required?: boolean
    invalid?: boolean
    rootClass?: string
    inputClass?: string
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: '',
    type: 'text',
    size: 'md',
    id: '',
    label: '',
    hint: '',
    error: '',
    placeholder: '',
    disabled: false,
    readonly: false,
    required: false,
    invalid: false,
    rootClass: '',
    inputClass: '',
})

const emit = defineEmits<{
    'update:modelValue': [value: string]
}>()

const attrs = useAttrs()
const model = useVModel(props, 'modelValue', emit)
const hasError = computed(() => props.invalid || Boolean(props.error))

const SIZE_CLASSES: Record<InputSize, string> = {
    sm: 'h-[3.8rem] px-[1.2rem] text-[1.35rem]',
    md: 'h-[4.4rem] px-[1.4rem] text-[1.4rem]',
    lg: 'h-[5rem] px-[1.6rem] text-[1.5rem]',
}

const controlClass = computed(() =>
    cn(
        'flex w-full items-center gap-[0.8rem] rounded-[0.9rem] border bg-surface-base transition',
        SIZE_CLASSES[props.size],
        hasError.value
            ? 'border-[color:var(--color-danger-bright)] focus-within:border-[color:var(--color-danger-bright)]'
            : 'border-[color:var(--color-line-2)] focus-within:border-brand focus-within:bg-white',
        props.disabled ? 'opacity-60 cursor-not-allowed' : '',
    ),
)

const inputClass = computed(() =>
    cn(
        'min-w-0 flex-1 border-0 bg-transparent p-0 text-text-primary outline-none',
        'placeholder:text-text-tertiary',
        'disabled:cursor-not-allowed',
        props.inputClass,
    ),
)
</script>

<template>
    <VField
        :id="id"
        :label="label"
        :hint="hint"
        :error="error"
        :required="required"
        :disabled="disabled"
        :invalid="hasError"
        :root-class="rootClass"
    >
        <template #default="{ controlId, describedBy, invalid: fieldInvalid }">
            <div :class="controlClass">
                <span
                    v-if="$slots.prefix"
                    class="inline-flex shrink-0 items-center text-text-tertiary"
                    aria-hidden="true"
                >
                    <slot name="prefix" />
                </span>
                <input
                    :id="controlId"
                    v-bind="attrs"
                    v-model="model"
                    :type="type"
                    :placeholder="placeholder"
                    :disabled="disabled"
                    :readonly="readonly"
                    :required="required"
                    :aria-describedby="describedBy"
                    :aria-invalid="fieldInvalid || undefined"
                    :class="inputClass"
                />
                <span
                    v-if="$slots.suffix"
                    class="inline-flex shrink-0 items-center text-text-tertiary"
                    aria-hidden="true"
                >
                    <slot name="suffix" />
                </span>
            </div>
        </template>
    </VField>
</template>
