<script setup lang="ts">
import { computed } from 'vue'

import { cn } from '@/components/ui/utils'

type SpinnerSize = 'sm' | 'md' | 'lg'
type SpinnerVariant = 'neutral' | 'primary' | 'inverse'

interface Props {
    size?: SpinnerSize
    variant?: SpinnerVariant
    label?: string
    class?: string
}

const props = withDefaults(defineProps<Props>(), {
    size: 'md',
    variant: 'primary',
    label: 'Loading',
    class: '',
})

const sizeClasses = computed<Record<SpinnerSize, string>>(() => ({
    sm: 'size-[1.4rem] border-[0.2rem]',
    md: 'size-[1.8rem] border-[0.25rem]',
    lg: 'size-[2.4rem] border-[0.3rem]',
}))

const variantClasses = computed<Record<SpinnerVariant, string>>(() => ({
    neutral: 'border-border-default border-t-text-secondary',
    primary: 'border-interactive-primary-disabled border-t-interactive-primary-default',
    inverse: 'border-white/35 border-t-white',
}))

const spinnerClassName = computed(() => cn(
    'inline-block animate-spin rounded-full border-solid',
    sizeClasses.value[props.size],
    variantClasses.value[props.variant],
    props.class,
))
</script>

<template>
    <span
        :class="spinnerClassName"
        role="status"
        :aria-label="label"
    >
        <span class="sr-only">{{ label }}</span>
    </span>
</template>
