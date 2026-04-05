<script setup lang="ts">
import { computed } from 'vue'

import { cn } from '@/components/ui/utils'

type CardVariant = 'default' | 'elevated' | 'outlined' | 'interactive'

interface Props {
    variant?: CardVariant
    as?: 'div' | 'article' | 'section'
    rootClass?: string
}

const props = withDefaults(defineProps<Props>(), {
    variant: 'default',
    as: 'div',
    rootClass: '',
})

const variantClasses = computed<Record<CardVariant, string>>(() => ({
    default: 'border border-border-default bg-surface-elevated shadow-sm',
    elevated: 'border border-border-subtle bg-surface-elevated shadow-md',
    outlined: 'border border-border-strong bg-surface-elevated shadow-none',
    interactive: [
        'border border-border-default bg-surface-elevated shadow-sm',
        'transition-transform duration-fast ease-default hover:-translate-y-[0.1rem] hover:shadow-md',
        'focus-within:border-interactive-secondary-default focus-within:shadow-md',
    ].join(' '),
}))
</script>

<template>
    <component
        :is="as"
        :class="cn('overflow-hidden rounded-xl', variantClasses[variant], props.rootClass)"
    >
        <header
            v-if="$slots.header"
            class="border-b border-border-subtle px-3 py-2"
        >
            <slot name="header" />
        </header>

        <div class="px-3 py-3">
            <slot />
        </div>

        <footer
            v-if="$slots.footer"
            class="border-t border-border-subtle px-3 py-2"
        >
            <slot name="footer" />
        </footer>
    </component>
</template>
