<script setup lang="ts">
import { computed, useAttrs } from 'vue'

defineOptions({
    inheritAttrs: false,
})

type IconButtonVariant = 'ghost-light' | 'ghost-dark' | 'outlined-light'
type IconButtonShape = 'rounded' | 'pill'
type IconButtonSize = 'sm' | 'md' | 'lg'

/**
 * Icon-only button. Callers MUST supply an `aria-label` attribute — it
 * passes through via `$attrs` since vue-tsc cannot reliably map the
 * kebab-case HTML attribute to a camelCase required prop.
 */
interface Props {
    variant?: IconButtonVariant
    shape?: IconButtonShape
    size?: IconButtonSize
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    variant: 'ghost-light',
    shape: 'rounded',
    size: 'md',
    type: 'button',
    disabled: false,
})

const attrs = useAttrs()

const SIZE_CLASSES: Record<IconButtonSize, string> = {
    sm: 'size-[1.6rem]',
    md: 'size-[2.4rem]',
    lg: 'size-[3.2rem]',
}

const SHAPE_CLASSES: Record<IconButtonShape, string> = {
    rounded: 'rounded-[0.6rem]',
    pill: 'rounded-full',
}

const VARIANT_CLASSES: Record<IconButtonVariant, string> = {
    'ghost-light': 'text-text-secondary hover:bg-surface-raised hover:text-text-primary',
    'ghost-dark': 'text-dark-ink-2 hover:bg-[rgb(63_185_179/0.12)] hover:text-dark-ink',
    'outlined-light': 'border border-[color:var(--color-line-2)] text-text-secondary hover:bg-surface-base hover:text-text-primary',
}

const buttonClass = computed(() => [
    'inline-flex items-center justify-center transition-colors',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
    'disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
    SIZE_CLASSES[props.size],
    SHAPE_CLASSES[props.shape],
    VARIANT_CLASSES[props.variant],
])
</script>

<template>
    <button
        v-bind="attrs"
        :type="type"
        :disabled="disabled"
        :class="buttonClass"
    >
        <slot />
    </button>
</template>