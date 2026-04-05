<script setup lang="ts">
import { computed, useAttrs } from 'vue'

import VSpinner from '@/components/ui/VSpinner.vue'
import { cn } from '@/components/ui/utils'

defineOptions({
    inheritAttrs: false,
})

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface Props {
    variant?: ButtonVariant
    size?: ButtonSize
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    loading?: boolean
    block?: boolean
    class?: string
}

const props = withDefaults(defineProps<Props>(), {
    variant: 'primary',
    size: 'md',
    type: 'button',
    disabled: false,
    loading: false,
    block: false,
    class: '',
})

const attrs = useAttrs()

const sizeClasses = computed<Record<ButtonSize, string>>(() => ({
    sm: 'min-h-[3.2rem] gap-1.5 rounded-md px-2.5 text-label font-semibold',
    md: 'min-h-[4rem] gap-2 rounded-lg px-3 text-body-sm font-semibold',
    lg: 'min-h-[4.8rem] gap-2 rounded-lg px-4 text-body font-semibold',
}))

const variantClasses = computed<Record<ButtonVariant, string>>(() => ({
    primary: [
        'bg-interactive-primary-default text-text-inverse shadow-sm',
        'hover:bg-interactive-primary-hover active:bg-interactive-primary-active',
        'disabled:bg-interactive-primary-disabled disabled:text-text-secondary',
    ].join(' '),
    secondary: [
        'bg-interactive-secondary-default text-text-inverse shadow-sm',
        'hover:bg-interactive-secondary-hover active:bg-interactive-secondary-active',
        'disabled:bg-interactive-secondary-disabled disabled:text-text-secondary',
    ].join(' '),
    ghost: [
        'bg-transparent text-text-primary',
        'hover:bg-interactive-ghost-hover active:bg-interactive-ghost-active',
        'disabled:text-text-disabled',
    ].join(' '),
    danger: [
        'bg-error-border text-text-inverse shadow-sm',
        'hover:bg-error-text active:bg-[color:rgb(127_29_29)]',
        'disabled:bg-error-surface disabled:text-error-text',
    ].join(' '),
}))

const isDisabled = computed(() => props.disabled || props.loading)

const buttonClassName = computed(() => cn(
    'relative inline-flex items-center justify-center whitespace-nowrap',
    'border border-transparent transition-transform duration-fast ease-default',
    'focus-visible:border-border-strong',
    'disabled:translate-y-0 disabled:shadow-none',
    props.block ? 'w-full' : 'max-w-full',
    sizeClasses.value[props.size],
    variantClasses.value[props.variant],
    props.class,
))

const spinnerSize = computed(() => {
    if (props.size === 'sm') {
        return 'sm'
    }

    return props.size === 'lg' ? 'lg' : 'md'
})
</script>

<template>
    <button
        v-bind="attrs"
        :type="type"
        :disabled="isDisabled"
        :aria-busy="loading || undefined"
        :class="buttonClassName"
    >
        <span
            v-if="loading"
            class="absolute inset-0 inline-flex items-center justify-center"
            aria-hidden="true"
        >
            <VSpinner
                :size="spinnerSize"
                variant="inverse"
            />
        </span>

        <span
            :class="cn(
                'inline-flex items-center justify-center',
                size === 'sm' ? 'gap-1.5' : 'gap-2',
                loading ? 'opacity-0' : 'opacity-100',
            )"
        >
            <span
                v-if="$slots.leading"
                class="inline-flex shrink-0"
                aria-hidden="true"
            >
                <slot name="leading" />
            </span>

            <span class="truncate">
                <slot />
            </span>

            <span
                v-if="$slots.trailing"
                class="inline-flex shrink-0"
                aria-hidden="true"
            >
                <slot name="trailing" />
            </span>
        </span>
    </button>
</template>
