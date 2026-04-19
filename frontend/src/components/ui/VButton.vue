<script setup lang="ts">
import { computed, useAttrs } from 'vue'

import VSpinner from '@/components/ui/VSpinner.vue'
import { cn } from '@/components/ui/utils'

defineOptions({
    inheritAttrs: false,
})

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'ink'
type ButtonShape = 'pill' | 'rect'
type ButtonSize = 'sm' | 'md' | 'lg'

interface Props {
    variant?: ButtonVariant
    shape?: ButtonShape
    size?: ButtonSize
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    loading?: boolean
    block?: boolean
    class?: string
}

const props = withDefaults(defineProps<Props>(), {
    variant: 'primary',
    shape: 'pill',
    size: 'md',
    type: 'button',
    disabled: false,
    loading: false,
    block: false,
    class: '',
})

const attrs = useAttrs()

const SIZE_CLASSES: Record<ButtonSize, string> = {
    sm: 'h-[3.4rem] px-[1.4rem] text-[1.3rem] gap-[0.8rem]',
    md: 'h-[4rem] px-[2.2rem] text-[1.35rem] gap-[0.8rem]',
    lg: 'h-[5.2rem] px-[2.6rem] text-[1.5rem] gap-[1rem]',
}

const SHAPE_CLASSES: Record<ButtonShape, string> = {
    pill: 'rounded-full',
    rect: 'rounded-[1rem]',
}

const isDisabled = computed(() => props.disabled || props.loading)

const variantClasses = computed<Record<ButtonVariant, string>>(() => ({
    primary: [
        'bg-brand text-white border border-transparent',
        'shadow-primary',
        'hover:bg-brand-deep hover:-translate-y-[0.1rem]',
        'active:translate-y-0',
        'disabled:bg-[color:var(--color-ink-4)] disabled:shadow-none',
    ].join(' '),
    secondary: [
        'bg-transparent text-text-primary',
        'border border-[color:var(--color-line-2)]',
        'hover:bg-white hover:border-[color:var(--color-ink-3)]',
        'disabled:text-text-tertiary',
    ].join(' '),
    ghost: [
        'bg-transparent text-text-primary border border-transparent',
        'hover:bg-brand-faint hover:text-brand',
        'disabled:text-text-tertiary',
    ].join(' '),
    danger: [
        'bg-[color:var(--color-danger)] text-white border border-transparent',
        'hover:bg-[color:var(--color-danger-bright)]',
        'shadow-primary',
        'disabled:bg-[color:var(--color-rose-soft)] disabled:text-[color:var(--color-rose-text)] disabled:shadow-none',
    ].join(' '),
    ink: [
        'bg-[color:var(--color-ink)] text-[color:var(--color-dark-ink)] border border-transparent',
        'shadow-ink-cta',
        'hover:bg-[color:var(--color-ink-2)]',
        'disabled:bg-[color:var(--color-ink-4)] disabled:shadow-none',
    ].join(' '),
}))

const wrapperClass = computed(() =>
    cn(props.block ? 'w-full' : 'inline-flex', isDisabled.value ? 'cursor-not-allowed' : ''),
)

const buttonClass = computed(() =>
    cn(
        'relative inline-flex items-center justify-center font-medium whitespace-nowrap',
        'transition-all duration-150 ease-out',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        'disabled:pointer-events-none',
        SIZE_CLASSES[props.size],
        SHAPE_CLASSES[props.shape],
        variantClasses.value[props.variant],
        props.block ? 'w-full' : '',
        props.class,
    ),
)

const spinnerVariant = computed(() => {
    if (props.variant === 'primary' || props.variant === 'danger' || props.variant === 'ink') {
        return 'inverse' as const
    }
    return 'primary' as const
})
</script>

<template>
    <span :class="wrapperClass">
        <button
            v-bind="attrs"
            :type="type"
            :disabled="isDisabled"
            :aria-busy="loading || undefined"
            :class="buttonClass"
        >
            <span
                v-if="loading"
                class="absolute inset-0 inline-flex items-center justify-center"
                aria-hidden="true"
            >
                <VSpinner
                    :size="props.size === 'lg' ? 'md' : 'sm'"
                    :variant="spinnerVariant"
                />
            </span>

            <span
                class="inline-flex items-center gap-[0.8rem]"
                :class="loading ? 'opacity-0' : 'opacity-100'"
            >
                <span
                    v-if="$slots.leading"
                    class="inline-flex shrink-0"
                    aria-hidden="true"
                >
                    <slot name="leading" />
                </span>
                <span class="truncate"><slot /></span>
                <span
                    v-if="$slots.trailing"
                    class="inline-flex shrink-0"
                    aria-hidden="true"
                >
                    <slot name="trailing" />
                </span>
            </span>
        </button>
    </span>
</template>
