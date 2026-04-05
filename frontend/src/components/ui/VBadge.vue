<script setup lang="ts">
import { computed } from 'vue'

import { cn } from '@/components/ui/utils'

type BadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'error'

interface Props {
    variant?: BadgeVariant
    rootClass?: string
}

const props = withDefaults(defineProps<Props>(), {
    variant: 'neutral',
    rootClass: '',
})

const variantClasses = computed<Record<BadgeVariant, string>>(() => ({
    neutral: 'border-border-default bg-surface-sunken text-text-secondary',
    primary: 'border-interactive-secondary-default bg-blue-50 text-blue-800',
    success: 'border-success-border bg-success-surface text-success-text',
    warning: 'border-warning-border bg-warning-surface text-warning-text',
    error: 'border-error-border bg-error-surface text-error-text',
}))
</script>

<template>
    <span
        :class="cn(
            'inline-flex items-center rounded-full border px-2 py-1 text-caption font-semibold',
            variantClasses[variant],
            props.rootClass,
        )"
    >
        <slot />
    </span>
</template>
