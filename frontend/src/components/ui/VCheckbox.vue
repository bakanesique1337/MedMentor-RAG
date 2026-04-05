<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { computed, useAttrs, useId } from 'vue'

import { cn } from '@/components/ui/utils'

defineOptions({
    inheritAttrs: false,
})

interface Props {
    modelValue?: boolean
    id?: string
    label?: string
    description?: string
    disabled?: boolean
    readonly?: boolean
    required?: boolean
    invalid?: boolean
    rootClass?: string
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    id: '',
    label: '',
    description: '',
    disabled: false,
    readonly: false,
    required: false,
    invalid: false,
    rootClass: '',
})

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
}>()

const attrs = useAttrs()
const uid = useId()
const model = useVModel(props, 'modelValue', emit)
const controlId = computed(() => props.id || `checkbox-${uid}`)
const descriptionId = computed(() => props.description ? `${controlId.value}-description` : '')

function handleChange(event: Event): void {
    if (props.readonly) {
        return
    }

    const target = event.target

    if (target instanceof HTMLInputElement) {
        model.value = target.checked
    }
}
</script>

<template>
    <label
        :for="controlId"
        :class="cn(
            'flex items-start gap-2 rounded-lg border border-transparent p-1 text-left',
            disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer',
            props.rootClass,
        )"
    >
        <span class="relative mt-[0.1rem] inline-flex shrink-0">
            <input
                :id="controlId"
                v-bind="attrs"
                :checked="model"
                type="checkbox"
                :disabled="disabled"
                :required="required"
                :aria-describedby="descriptionId || undefined"
                :aria-invalid="invalid || undefined"
                class="peer sr-only"
                @change="handleChange"
            />

            <span
                :class="cn(
                    'inline-flex size-[2rem] items-center justify-center rounded-md border text-label font-bold',
                    model
                        ? 'border-interactive-primary-default bg-interactive-primary-default text-text-inverse'
                        : 'border-border-default bg-surface-elevated text-transparent',
                    invalid ? 'border-error-border' : '',
                )"
                aria-hidden="true"
            >
                <span :class="model ? 'opacity-100' : 'opacity-0'">x</span>
            </span>
        </span>

        <span class="flex min-w-0 flex-col gap-0.5">
            <span
                v-if="label || $slots.default"
                class="text-body-sm font-semibold text-text-primary"
            >
                <slot>
                    {{ label }}
                </slot>
            </span>

            <span
                v-if="description || $slots.description"
                :id="descriptionId"
                class="text-body-sm text-text-secondary"
            >
                <slot name="description">
                    {{ description }}
                </slot>
            </span>
        </span>
    </label>
</template>
