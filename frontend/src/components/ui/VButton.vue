<script setup lang="ts">
import { computed, ref, useAttrs } from 'vue'

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

interface RippleState {
    id: number
    size: number
    x: number
    y: number
}

const ripples = ref<RippleState[]>([])

const sizeClasses = computed<Record<ButtonSize, string>>(() => ({
    sm: 'h-[3.2rem] gap-1.2 squircle squircle-md px-4 text-label font-semibold',
    md: 'h-[4rem] gap-2 squircle squircle-md px-4 text-body-sm font-semibold',
    lg: 'h-[4.8rem] gap-2 squircle squircle-lg px-4 text-body font-semibold',
}))

const surfaceSizeClasses = computed<Record<ButtonSize, string>>(() => ({
    sm: 'squircle squircle-md',
    md: 'squircle squircle-md',
    lg: 'squircle squircle-lg',
}))

const variantClasses = computed<Record<ButtonVariant, string>>(() => ({
    primary: [
        'text-text-inverse shadow-sm',
        'hover:scale-[1.04] active:scale-[0.98]',
        'disabled:text-text-secondary',
    ].join(' '),
    secondary: [
        'text-text-inverse shadow-sm',
        'hover:scale-[1.04] active:scale-[0.98]',
        'disabled:text-text-secondary',
    ].join(' '),
    ghost: [
        'text-text-primary',
        'hover:scale-[1.04] active:scale-[0.98]',
        'disabled:text-text-disabled',
    ].join(' '),
    danger: [
        'text-text-inverse shadow-sm',
        'hover:scale-[1.04] active:scale-[0.98]',
        'disabled:text-error-text',
    ].join(' '),
}))

const isDisabled = computed(() => props.disabled || props.loading)

const variantSurfaceClasses = computed<Record<ButtonVariant, string>>(() => ({
    primary: isDisabled.value
        ? 'bg-interactive-primary-disabled'
        : 'bg-interactive-primary-default group-hover/button:scale-[1.01] group-hover/button:bg-interactive-primary-hover group-active/button:scale-[0.98] group-active/button:bg-interactive-primary-active',
    secondary: isDisabled.value
        ? 'bg-interactive-secondary-disabled'
        : 'bg-interactive-secondary-default group-hover/button:scale-[1.01] group-hover/button:bg-interactive-secondary-hover group-active/button:scale-[0.98] group-active/button:bg-interactive-secondary-active',
    ghost: isDisabled.value
        ? 'bg-transparent'
        : 'bg-transparent group-hover/button:scale-[1.01] group-hover/button:bg-interactive-ghost-hover group-active/button:scale-[0.98] group-active/button:bg-interactive-ghost-active',
    danger: isDisabled.value
        ? 'bg-error-surface'
        : 'bg-error-border group-hover/button:scale-[1.01] group-hover/button:bg-error-text group-active/button:scale-[0.98] group-active/button:bg-[color:rgb(127_29_29)]',
}))

const buttonClassName = computed(() => cn(
    'group/button relative isolate inline-flex items-center justify-center whitespace-nowrap',
    'border border-transparent transition-transform duration-fast ease-default',
    'focus-visible:border-border-strong',
    'disabled:pointer-events-none disabled:translate-y-0 disabled:shadow-none',
    'w-full',
    sizeClasses.value[props.size],
    variantClasses.value[props.variant],
    props.class,
))

const wrapperClassName = computed(() => cn(
    'inline-flex',
    props.block ? 'w-full' : 'max-w-full',
    isDisabled.value ? 'cursor-not-allowed' : '',
))

const spinnerSize = computed(() => {
    if (props.size === 'sm') {
        return 'sm'
    }

    return props.size === 'lg' ? 'lg' : 'md'
})

function handlePointerDown(event: PointerEvent) {
    if (isDisabled.value) {
        return
    }

    const target = event.currentTarget

    if (!(target instanceof HTMLButtonElement)) {
        return
    }

    const rect = target.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height) * 1.15
    const ripple: RippleState = {
        id: window.setTimeout(() => {
            ripples.value = ripples.value.filter((item) => item.id !== ripple.id)
        }, 550),
        size,
        x: event.clientX - rect.left - size / 2,
        y: event.clientY - rect.top - size / 2,
    }

    ripples.value = [...ripples.value, ripple]
}
</script>

<template>
    <span :class="wrapperClassName">
        <button
            v-bind="attrs"
            :type="type"
            :disabled="isDisabled"
            :aria-busy="loading || undefined"
            :class="buttonClassName"
            @pointerdown="handlePointerDown"
        >
            <span
                aria-hidden="true"
                :class="cn(
                    'pointer-events-none absolute inset-0 -z-10 overflow-hidden transition-colors duration-fast ease-default',
                    surfaceSizeClasses[size],
                    variantSurfaceClasses[variant],
                )"
            >
                <span
                    v-for="ripple in ripples"
                    :key="ripple.id"
                    class="ripple"
                    :style="{
                        width: `${ripple.size}px`,
                        height: `${ripple.size}px`,
                        left: `${ripple.x}px`,
                        top: `${ripple.y}px`,
                    }"
                />
            </span>

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
                    <slot name="leading"/>
                </span>

                <span class="truncate">
                    <slot/>
                </span>

                <span
                    v-if="$slots.trailing"
                    class="inline-flex shrink-0"
                    aria-hidden="true"
                >
                    <slot name="trailing"/>
                </span>
            </span>
        </button>
    </span>
</template>
