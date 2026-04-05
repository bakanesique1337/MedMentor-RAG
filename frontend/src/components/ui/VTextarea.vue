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
    resize: 'vertical',
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

const resizeClassName = computed<Record<TextareaResize, string>>(() => ({
    none: 'resize-none',
    vertical: 'resize-y',
    both: 'resize',
}))

const textareaClassName = computed(() => cn(
    'w-full rounded-lg border bg-surface-elevated px-3 py-2 text-body text-text-primary',
    'placeholder:text-text-tertiary',
    'disabled:bg-surface-muted disabled:text-text-disabled',
    'readonly:bg-surface-sunken readonly:text-text-secondary',
    hasError.value
        ? 'border-error-border bg-error-surface/40'
        : 'border-border-default hover:border-border-strong focus:border-interactive-secondary-default',
    resizeClassName.value[props.resize],
    props.textareaClass,
))

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
        <template
            #default="{
                controlId,
                describedBy,
                invalid: fieldInvalid,
            }"
        >
            <textarea
                :id="controlId"
                ref="textarea"
                v-bind="attrs"
                :value="model"
                :rows="minRows"
                :placeholder="placeholder"
                :disabled="disabled"
                :readonly="readonly"
                :required="required"
                :aria-describedby="describedBy"
                :aria-invalid="fieldInvalid || undefined"
                :class="textareaClassName"
                @input="handleInput"
            />
        </template>
    </VField>
</template>
