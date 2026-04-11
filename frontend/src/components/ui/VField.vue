<script setup lang="ts">
import { computed, useId } from 'vue'

import { cn } from '@/components/ui/utils'

interface Props {
    id?: string
    label?: string
    hint?: string
    error?: string
    required?: boolean
    disabled?: boolean
    invalid?: boolean
    rootClass?: string
}

const props = withDefaults(defineProps<Props>(), {
    id: '',
    label: '',
    hint: '',
    error: '',
    required: false,
    disabled: false,
    invalid: false,
    rootClass: '',
})

const fieldUid = useId()
const controlId = computed(() => props.id || `field-${fieldUid}`)
const hintId = computed(() => `${controlId.value}-hint`)
const errorId = computed(() => `${controlId.value}-error`)

const describedBy = computed(() => {
    const ids: string[] = []

    if (props.hint) {
        ids.push(hintId.value)
    }

    if (props.error) {
        ids.push(errorId.value)
    }

    return ids.join(' ')
})

const hasError = computed(() => props.invalid || Boolean(props.error))
</script>

<template>
    <div
        :class="cn(
            'flex w-full flex-col gap-2',
            disabled ? 'opacity-75' : '',
            props.rootClass,
        )"
    >
        <label
            v-if="label || $slots.label"
            :for="controlId"
            class="flex items-center gap-1 text-[1.25rem] font-medium tracking-[-0.01em] text-text-primary/88"
        >
            <slot name="label">
                <span>{{ label }}</span>
            </slot>

            <span
                v-if="required"
                class="text-error-text"
                aria-hidden="true"
            >
                *
            </span>
        </label>

        <slot
            :control-id="controlId"
            :described-by="describedBy || undefined"
            :invalid="hasError"
            :hint-id="hintId"
            :error-id="errorId"
        />

        <p
            v-if="hint || $slots.hint"
            :id="hintId"
            class="text-[1.25rem] leading-[1.45] text-text-secondary/88"
        >
            <slot name="hint">
                {{ hint }}
            </slot>
        </p>

        <p
            v-if="error || $slots.error"
            :id="errorId"
            class="text-[1.25rem] font-medium leading-[1.45] text-error-text"
        >
            <slot name="error">
                {{ error }}
            </slot>
        </p>
    </div>
</template>
