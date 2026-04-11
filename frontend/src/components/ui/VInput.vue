<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { computed, useAttrs } from 'vue'

import VCloseIcon from '@/components/icons/VCloseIcon.vue'
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

const showClearButton = computed(() => (
    props.type === 'search'
    && !props.disabled
    && !props.readonly
    && model.value.length > 0
))

const SIZE_CLASSES: Record<InputSize, string> = {
    sm: 'h-[3.8rem] px-2.5 text-body-sm',
    md: 'h-[4.4rem] px-3 text-body',
    lg: 'h-[5rem] px-3.5 text-[1.6rem]',
}

const controlClassName = computed(() => cn(
    'input-control group flex w-full items-center squircle squircle-md border bg-surface-elevated',
    SIZE_CLASSES[props.size],
    hasError.value ? 'is-invalid' : '',
    props.disabled ? 'is-disabled' : '',
    props.readonly ? 'is-readonly' : '',
))

const inputClassName = computed(() => cn(
    'min-w-0 flex-1 border-0 bg-transparent p-0 text-text-primary outline-none',
    'placeholder:text-text-tertiary',
    'focus:outline-none focus-visible:outline-none focus-visible:shadow-none',
    'transition-[color] duration-fast ease-default',
    'disabled:cursor-not-allowed disabled:text-text-disabled',
    'readonly:text-text-secondary',
    props.inputClass,
))

/** Prevents blur on clear button click so input stays focused */
function handleClearPointerDown(event: PointerEvent): void {
    event.preventDefault()
}

function handleClearClick(): void {
    model.value = ''
}
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
            <div :class="controlClassName">
                <span
                    v-if="$slots.prefix"
                    class="pointer-events-none mr-2 inline-flex shrink-0 items-center text-text-tertiary transition-colors duration-fast ease-default group-focus-within:text-interactive-primary-default"
                    aria-hidden="true"
                >
                    <slot name="prefix"/>
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
                    :class="inputClassName"
                />

                <button
                    v-if="showClearButton"
                    type="button"
                    class="ml-2 inline-flex size-[2rem] shrink-0 items-center justify-center rounded-full bg-text-secondary/10 text-text-secondary transition-colors duration-fast ease-default hover:bg-text-secondary/16 hover:text-text-primary"
                    aria-label="Clear input"
                    @pointerdown="handleClearPointerDown"
                    @click="handleClearClick"
                >
                    <VCloseIcon/>
                </button>

                <span
                    v-if="$slots.suffix && !showClearButton"
                    class="pointer-events-none ml-2 inline-flex shrink-0 items-center text-text-tertiary transition-colors duration-fast ease-default group-focus-within:text-interactive-primary-default"
                    aria-hidden="true"
                >
                    <slot name="suffix"/>
                </span>
            </div>
        </template>
    </VField>
</template>

<style scoped>
.input-control {
    border-color: var(--color-border-default);
    transition: border-color var(--duration-input) var(--ease-input),
    box-shadow var(--duration-input) var(--ease-input);
}

.input-control:hover {
    border-color: var(--color-border-strong);
}

.input-control:focus-within {
    border-color: var(--color-interactive-primary-default);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-interactive-primary-default) 15%, transparent);
}

.input-control.is-disabled {
    border-color: var(--color-border-subtle);
    background-color: var(--color-surface-muted);
    cursor: not-allowed;
}

.input-control.is-disabled:hover,
.input-control.is-disabled:focus-within {
    border-color: var(--color-border-subtle);
    box-shadow: none;
}

.input-control.is-readonly {
    background-color: var(--color-surface-sunken);
}

.input-control.is-readonly:hover,
.input-control.is-readonly:focus-within {
    border-color: var(--color-border-default);
    box-shadow: none;
}

.input-control.is-invalid {
    border-color: var(--color-error-border);
}

.input-control.is-invalid:focus-within {
    border-color: var(--color-error-border);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-error-border) 15%, transparent);
}

input[type="search"]::-webkit-search-decoration,
input[type="search"]::-webkit-search-cancel-button,
input[type="search"]::-webkit-search-results-button,
input[type="search"]::-webkit-search-results-decoration {
    display: none;
    -webkit-appearance: none;
}
</style>
