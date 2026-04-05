<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { computed, useAttrs } from 'vue'

import VField from '@/components/ui/VField.vue'
import { cn } from '@/components/ui/utils'

defineOptions({
    inheritAttrs: false,
})

export interface SelectOption {
    label: string
    value: string
    disabled?: boolean
}

interface Props {
    modelValue?: string
    id?: string
    label?: string
    hint?: string
    error?: string
    placeholder?: string
    options?: SelectOption[]
    disabled?: boolean
    required?: boolean
    invalid?: boolean
    rootClass?: string
    selectClass?: string
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: '',
    id: '',
    label: '',
    hint: '',
    error: '',
    placeholder: '',
    options: () => [],
    disabled: false,
    required: false,
    invalid: false,
    rootClass: '',
    selectClass: '',
})

const emit = defineEmits<{
    'update:modelValue': [value: string]
}>()

const attrs = useAttrs()
const model = useVModel(props, 'modelValue', emit)
const hasError = computed(() => props.invalid || Boolean(props.error))

const selectClassName = computed(() => cn(
    'w-full rounded-lg border bg-surface-elevated px-3 py-2 text-body text-text-primary',
    'disabled:bg-surface-muted disabled:text-text-disabled',
    hasError.value
        ? 'border-error-border bg-error-surface/40'
        : 'border-border-default hover:border-border-strong focus:border-interactive-secondary-default',
    props.selectClass,
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
            <select
                :id="controlId"
                v-bind="attrs"
                v-model="model"
                :disabled="disabled"
                :required="required"
                :aria-describedby="describedBy"
                :aria-invalid="fieldInvalid || undefined"
                :class="selectClassName"
            >
                <option
                    v-if="placeholder"
                    value=""
                    disabled
                >
                    {{ placeholder }}
                </option>

                <option
                    v-for="option in options"
                    :key="option.value"
                    :value="option.value"
                    :disabled="option.disabled"
                >
                    {{ option.label }}
                </option>
            </select>
        </template>
    </VField>
</template>
