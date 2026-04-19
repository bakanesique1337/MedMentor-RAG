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

const uid = useId()
const controlId = computed(() => props.id || `field-${uid}`)
const hintId = computed(() => `${controlId.value}-hint`)
const errorId = computed(() => `${controlId.value}-error`)
const hasError = computed(() => props.invalid || Boolean(props.error))

const describedBy = computed(() => {
    const ids: string[] = []
    if (props.hint) ids.push(hintId.value)
    if (props.error) ids.push(errorId.value)
    return ids.length > 0 ? ids.join(' ') : undefined
})

const rootClass = computed(() => cn('flex flex-col gap-[0.6rem]', props.rootClass))
</script>

<template>
    <div :class="rootClass">
        <div
            v-if="label || $slots.action"
            class="flex items-baseline justify-between"
        >
            <label
                v-if="label"
                :for="controlId"
                class="text-eyebrow text-text-secondary"
                :class="disabled ? 'opacity-60' : ''"
            >
                {{ label }}
                <span
                    v-if="required"
                    class="text-[color:var(--color-danger-bright)]"
                >*</span>
            </label>
            <span
                v-if="$slots.action"
                class="text-[1.15rem] text-brand"
            >
                <slot name="action" />
            </span>
        </div>

        <slot
            :control-id="controlId"
            :described-by="describedBy"
            :invalid="hasError"
        />

        <p
            v-if="error"
            :id="errorId"
            class="text-[1.2rem] text-[color:var(--color-danger-bright)]"
        >
            {{ error }}
        </p>
        <p
            v-else-if="hint"
            :id="hintId"
            class="text-[1.2rem] text-text-tertiary"
        >
            {{ hint }}
        </p>
    </div>
</template>
