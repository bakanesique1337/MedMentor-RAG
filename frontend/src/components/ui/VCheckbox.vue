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

const isInteractive = computed(() => !props.disabled && !props.readonly)

const boxClassName = computed(() => cn(
    'checkbox-box',
    'relative inline-flex size-[2rem] shrink-0 items-center justify-center',
    'squircle squircle-sm',
    'border',
    model.value
        ? 'is-checked border-interactive-primary-default bg-interactive-primary-default'
        : props.invalid
            ? 'border-error-border bg-surface-elevated'
            : 'border-border-default bg-surface-elevated',
    isInteractive.value ? 'interactive' : '',
))

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
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
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
                :class="boxClassName"
                aria-hidden="true"
            >
                <svg
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="checkbox-check size-[1.2rem] text-text-inverse"
                    :class="model ? 'is-checked' : ''"
                    aria-hidden="true"
                >
                    <path d="M 1.5 6 L 4.5 9 L 10.5 3"/>
                </svg>
            </span>
        </span>

        <span class="flex min-w-0 flex-col gap-0.5">
            <span
                v-if="label || $slots.default"
                class="text-body-sm font-semibold text-text-primary"
            >
                <slot>{{ label }}</slot>
            </span>

            <span
                v-if="description || $slots.description"
                :id="descriptionId"
                class="text-body-sm text-text-secondary"
            >
                <slot name="description">{{ description }}</slot>
            </span>
        </span>
    </label>
</template>

<style scoped>
/* Box transitions */
.checkbox-box {
    transition:
        background-color var(--duration-input) var(--ease-input),
        border-color var(--duration-input) var(--ease-input),
        box-shadow var(--duration-input) var(--ease-input),
        transform var(--duration-fast) var(--ease-spring);
}

/* Scale on hover / active — only when interactive */
.checkbox-box.interactive:hover {
    transform: scale(1.08);
}

/* Border darkens on hover only in unchecked state */
.checkbox-box.interactive:not(.is-checked):hover {
    border-color: var(--color-border-strong);
}

.checkbox-box.interactive:active {
    transform: scale(0.92);
}

/* Focus ring driven by hidden peer input */
.peer:focus-visible ~ .checkbox-box {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-interactive-primary-default) 15%, transparent);
}

/* Checkmark draw animation via stroke-dasharray */
.checkbox-check path {
    stroke-dasharray: 13;
    stroke-dashoffset: 13;
    opacity: 0;
    transition:
        stroke-dashoffset 200ms var(--ease-default),
        opacity 80ms var(--ease-default);
}

.checkbox-check.is-checked path {
    stroke-dashoffset: 0;
    opacity: 1;
}
</style>
