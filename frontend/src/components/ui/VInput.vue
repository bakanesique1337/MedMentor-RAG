<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { computed, useAttrs } from 'vue'

import VField from '@/components/ui/VField.vue'
import { cn } from '@/components/ui/utils'

defineOptions({
    inheritAttrs: false,
})

type InputType = 'text' | 'password' | 'email' | 'search'
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

const sizeClasses = computed<Record<InputSize, string>>(() => ({
    sm: 'min-h-[3.6rem] px-2.5 text-body-sm',
    md: 'min-h-[4.2rem] px-3 text-body',
    lg: 'min-h-[4.8rem] px-3 text-body',
}))

const inputClassName = computed(() => cn(
    'w-full rounded-lg border bg-surface-elevated text-text-primary',
    'placeholder:text-text-tertiary',
    'disabled:bg-surface-muted disabled:text-text-disabled',
    'readonly:bg-surface-sunken readonly:text-text-secondary',
    hasError.value
        ? 'border-error-border bg-error-surface/40'
        : 'border-border-default hover:border-border-strong focus:border-interactive-secondary-default',
    sizeClasses.value[props.size],
    props.inputClass,
))
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
        <template
            #default="{
                controlId,
                describedBy,
                invalid: fieldInvalid,
            }"
        >
            <div class="relative">
                <span
                    v-if="$slots.prefix"
                    class="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center text-text-secondary"
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
                    :class="cn(
                        inputClassName,
                        $slots.prefix ? 'pl-8' : '',
                        $slots.suffix ? 'pr-8' : '',
                    )"
                />

                <span
                    v-if="$slots.suffix"
                    class="pointer-events-none absolute inset-y-0 right-3 inline-flex items-center text-text-secondary"
                    aria-hidden="true"
                >
                    <slot name="suffix" />
                </span>
            </div>
        </template>
    </VField>
</template>
