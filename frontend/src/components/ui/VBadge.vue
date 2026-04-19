<script setup lang="ts">
import { computed } from 'vue'

import { cn } from '@/components/ui/utils'

type BadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'mint' | 'ink'
type BadgeShape = 'pill' | 'rect'

interface Props {
    variant?: BadgeVariant
    shape?: BadgeShape
    mono?: boolean
    class?: string
}

const props = withDefaults(defineProps<Props>(), {
    variant: 'neutral',
    shape: 'pill',
    mono: false,
    class: '',
})

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
    neutral: 'bg-surface-base text-text-secondary border border-[color:var(--color-line)]',
    primary: 'bg-brand-faint text-brand',
    success: 'bg-brand-ghost text-brand',
    warning: 'bg-[color:var(--color-amber-soft)] text-[color:var(--color-amber-text)]',
    error: 'bg-[color:var(--color-rose-soft)] text-[color:var(--color-rose-text)]',
    info: 'bg-brand-ghost text-brand-deep',
    mint: 'bg-[color:var(--color-mint)] text-[color:var(--color-ink)]',
    ink: 'bg-[color:var(--color-ink)] text-[color:var(--color-dark-ink)]',
}

const badgeClass = computed(() =>
    cn(
        'inline-flex items-center gap-[0.5rem] px-[0.9rem] py-[0.3rem] text-[1.15rem] font-medium',
        props.shape === 'pill' ? 'rounded-full' : 'rounded-[0.5rem]',
        props.mono ? 'font-mono uppercase tracking-[0.12em] text-[1.05rem] font-semibold' : '',
        VARIANT_CLASSES[props.variant],
        props.class,
    ),
)
</script>

<template>
    <span :class="badgeClass">
        <slot />
    </span>
</template>
