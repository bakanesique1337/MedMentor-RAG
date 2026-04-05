<script setup lang="ts">
import { computed } from 'vue'

import { cn } from '@/components/ui/utils'

type TagVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'error'

interface Props {
    variant?: TagVariant
    rootClass?: string
}

const props = withDefaults(defineProps<Props>(), {
    variant: 'neutral',
    rootClass: '',
})

const variantClasses = computed<Record<TagVariant, string>>(() => ({
    neutral: 'border-border-default bg-surface-elevated text-text-secondary',
    primary: 'border-interactive-primary-default/25 bg-teal-50 text-teal-800',
    success: 'border-success-border/20 bg-success-surface text-success-text',
    warning: 'border-warning-border/20 bg-warning-surface text-warning-text',
    error: 'border-error-border/20 bg-error-surface text-error-text',
}))
</script>

<template>
    <span
        :class="cn(
            'inline-flex max-w-full items-center rounded-full border px-2 py-1 text-caption font-medium',
            variantClasses[variant],
            props.rootClass,
        )"
    >
        <span class="truncate">
            <slot />
        </span>
    </span>
</template>
