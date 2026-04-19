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

const SIZE_CLASSES: Record<SpinnerSize, string> = {
    sm: 'size-[1.4rem] border-[0.2rem]',
    md: 'size-[2rem] border-[0.25rem]',
    lg: 'size-[2.6rem] border-[0.3rem]',
}

const VARIANT_CLASSES: Record<SpinnerVariant, string> = {
    neutral: 'border-[color:var(--color-line-2)] border-t-[color:var(--color-ink-3)]',
    primary: 'border-[color:var(--color-teal-soft)] border-t-brand',
    inverse: 'border-white/35 border-t-white',
}

const spinnerClass = computed(() =>
    cn(
        'inline-block animate-spin rounded-full border-solid',
        SIZE_CLASSES[props.size],
        VARIANT_CLASSES[props.variant],
        props.class,
    ),
)
</script>

<template>
    <span
        :class="spinnerClass"
        role="status"
        :aria-label="label"
    >
        <span class="sr-only">{{ label }}</span>
    </span>
</template>
