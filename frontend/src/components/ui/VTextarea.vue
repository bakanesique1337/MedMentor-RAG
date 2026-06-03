<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { computed, useAttrs } from 'vue'

import VField from '@/components/ui/VField.vue'
import { cn } from '@/components/ui/utils'

defineOptions({
    inheritAttrs: false,
})

interface Props {
    modelValue?: string
    id?: string
    label?: string
    hint?: string
    error?: string
    placeholder?: string
    rows?: number
    disabled?: boolean
    readonly?: boolean
    required?: boolean
    invalid?: boolean
    rootClass?: string
    inputClass?: string
    resize?: 'none' | 'vertical'
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: '',
    id: '',
    label: '',
    hint: '',
    error: '',
    placeholder: '',
    rows: 3,
    disabled: false,
    readonly: false,
    required: false,
    invalid: false,
    rootClass: '',
    inputClass: '',
    resize: 'vertical',
})

const emit = defineEmits<{
    'update:modelValue': [value: string]
}>()

const attrs = useAttrs()
const model = useVModel(props, 'modelValue', emit)
const hasError = computed(() => props.invalid || Boolean(props.error))

const controlClass = computed(() =>
    cn(
        'flex w-full rounded-[0.9rem] border bg-surface-base p-[1.2rem] text-[1.4rem] transition',
        hasError.value
            ? 'border-[color:var(--color-danger-bright)] focus-within:border-[color:var(--color-danger-bright)]'
            : 'border-[color:var(--color-line-2)] focus-within:border-brand focus-within:bg-white',
        props.disabled ? 'opacity-60 cursor-not-allowed' : '',
    ),
)

const textareaClass = computed(() =>
    cn(
        'min-w-0 flex-1 border-0 bg-transparent p-0 text-text-primary outline-none',
        'placeholder:text-text-tertiary',
        props.resize === 'none' ? 'resize-none' : 'resize-y',
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
                <textarea
                    :id="controlId"
                    v-bind="attrs"
                    v-model="model"
                    :placeholder="placeholder"
                    :rows="rows"
                    :disabled="disabled"
                    :readonly="readonly"
                    :required="required"
                    :aria-describedby="describedBy"
                    :aria-invalid="fieldInvalid || undefined"
                    :class="textareaClass"
                />
            </div>
        </template>
    </VField>
</template>
