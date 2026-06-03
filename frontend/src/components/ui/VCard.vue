<script setup lang="ts">
import { computed } from 'vue'

import { cn } from '@/components/ui/utils'

type CardVariant = 'default' | 'outlined' | 'soft' | 'ink'
type CardPadding = 'none' | 'sm' | 'md' | 'lg'

interface Props {
    variant?: CardVariant
    padding?: CardPadding
    class?: string
}

const props = withDefaults(defineProps<Props>(), {
    variant: 'default',
    padding: 'md',
    class: '',
})

const VARIANT_CLASSES: Record<CardVariant, string> = {
    default: 'bg-white border border-[color:var(--color-line)] shadow-card',
    outlined: 'bg-transparent border border-[color:var(--color-line-2)]',
    soft: 'bg-brand-ghost border border-[color:var(--color-teal-soft)]',
    ink: 'bg-[color:var(--color-ink)] text-[color:var(--color-dark-ink)]',
}

const PADDING_CLASSES: Record<CardPadding, string> = {
    none: '',
    sm: 'p-[1.4rem]',
    md: 'p-[2rem]',
    lg: 'p-[3rem]',
}

const cardClass = computed(() =>
    cn(
        'rounded-[1.4rem]',
        VARIANT_CLASSES[props.variant],
        PADDING_CLASSES[props.padding],
        props.class,
    ),
)
</script>

<template>
    <div :class="cardClass">
        <slot />
    </div>
</template>
