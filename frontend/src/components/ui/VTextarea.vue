<script setup lang="ts">
import { useTextareaAutosize, useVModel } from '@vueuse/core'
import { computed, useAttrs, watch } from 'vue'

import VField from '@/components/ui/VField.vue'
import { cn } from '@/components/ui/utils'

defineOptions({
    inheritAttrs: false,
})

type TextareaResize = 'none' | 'vertical' | 'both'

interface Props {
    modelValue?: string
    id?: string
    label?: string
    hint?: string
    error?: string
    placeholder?: string
    disabled?: boolean
    readonly?: boolean
    required?: boolean
    invalid?: boolean
    minRows?: number
    autosize?: boolean
    resize?: TextareaResize
    rootClass?: string
    textareaClass?: string
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: '',
    id: '',
    label: '',
    hint: '',
    error: '',
    placeholder: '',
    disabled: false,
    readonly: false,
    required: false,
    invalid: false,
    minRows: 4,
    autosize: false,
    resize: 'none',
    rootClass: '',
    textareaClass: '',
})

const emit = defineEmits<{
    'update:modelValue': [value: string]
}>()

const attrs = useAttrs()
const model = useVModel(props, 'modelValue', emit)
const { textarea, input, triggerResize } = useTextareaAutosize({
    input: model,
})

watch(model, (value) => {
    if (props.autosize) {
        input.value = value
    }
})

watch(input, (value) => {
    if (props.autosize && value !== model.value) {
        model.value = value
    }
})

const hasError = computed(() => props.invalid || Boolean(props.error))

// text-body: 1.5rem * line-height 1.5 = 2.25rem per row; py-[1.15rem] = 2.3rem total vertical padding
const minHeight = computed(() => `${props.minRows * 2.25 + 2.3}rem`)

const RESIZE_CLASSES: Record<TextareaResize, string> = {
    none: 'resize-none',
    vertical: 'resize-y',
    both: 'resize',
}

const controlClassName = computed(() => cn(
    'input-control group w-full squircle squircle-md border bg-surface-elevated',
    hasError.value ? 'is-invalid' : '',
    props.disabled ? 'is-disabled' : '',
    props.readonly ? 'is-readonly' : '',
))

const textareaClassName = computed(() => cn(
    'block w-full min-w-0 border-0 bg-transparent px-3 py-[1.15rem] text-body text-text-primary outline-none',
    'placeholder:text-text-tertiary',
    'focus:outline-none focus-visible:outline-none focus-visible:shadow-none',
    'transition-[color] duration-fast ease-default',
    'disabled:cursor-not-allowed disabled:text-text-disabled',
    'readonly:text-text-secondary',
    RESIZE_CLASSES[props.resize],
    props.textareaClass,
))

/** @param event - native input event from textarea */
function handleInput(event: Event): void {
    const target = event.target

    if (!(target instanceof HTMLTextAreaElement)) {
        return
    }

    model.value = target.value

    if (props.autosize) {
        input.value = target.value
        triggerResize()
    }
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
                <textarea
                    :id="controlId"
                    ref="textarea"
                    v-bind="attrs"
                    :value="model"
                    :rows="minRows"
                    :style="{ minHeight: minHeight }"
                    :placeholder="placeholder"
                    :disabled="disabled"
                    :readonly="readonly"
                    :required="required"
                    :aria-describedby="describedBy"
                    :aria-invalid="fieldInvalid || undefined"
                    :class="textareaClassName"
                    @input="handleInput"
                />
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
</style>