<script setup lang="ts">
import { computed } from 'vue'

import { cn } from '@/components/ui/utils'

type TagTone = 'neutral' | 'brand' | 'mint' | 'warning' | 'danger'

interface Props {
    tone?: TagTone
    mono?: boolean
    class?: string
}

const props = withDefaults(defineProps<Props>(), {
    tone: 'neutral',
    mono: true,
    class: '',
})

const TONE_CLASSES: Record<TagTone, string> = {
    neutral: 'bg-surface-base text-text-secondary border-[color:var(--color-line)]',
    brand: 'bg-brand-faint text-brand border-transparent',
    mint: 'bg-[color:var(--color-mint)]/30 text-[color:var(--color-ink)] border-transparent',
    warning: 'bg-[color:var(--color-amber-soft)] text-[color:var(--color-amber-text)] border-transparent',
    danger: 'bg-[color:var(--color-rose-soft)] text-[color:var(--color-rose-text)] border-transparent',
}

const tagClass = computed(() =>
    cn(
        'inline-flex items-center gap-[0.5rem] rounded-[0.5rem] border px-[0.8rem] py-[0.3rem]',
        props.mono ? 'text-eyebrow-sm' : 'text-[1.2rem] font-medium',
        TONE_CLASSES[props.tone],
        props.class,
    ),
)
</script>

<template>
    <span :class="tagClass">
        <slot />
    </span>
</template>
