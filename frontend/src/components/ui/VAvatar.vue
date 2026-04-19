<script setup lang="ts">
import { computed } from 'vue'

import { getInitials } from '@/components/ui/utils'

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

interface Props {
    name?: string
    src?: string
    alt?: string
    size?: AvatarSize
    tone?: 'brand' | 'ink' | 'mint'
}

const props = withDefaults(defineProps<Props>(), {
    name: '',
    src: '',
    alt: '',
    size: 'md',
    tone: 'brand',
})

const SIZE_CLASSES: Record<AvatarSize, string> = {
    sm: 'size-[2.8rem] text-[1.1rem]',
    md: 'size-[3.6rem] text-[1.2rem]',
    lg: 'size-[4.8rem] text-[1.5rem]',
    xl: 'size-[8rem] text-[2.4rem]',
}

const TONE_CLASSES: Record<NonNullable<Props['tone']>, string> = {
    brand: 'bg-brand text-[color:var(--color-ink)]',
    ink: 'bg-[color:var(--color-ink)] text-[color:var(--color-mint)]',
    mint: 'bg-[color:var(--color-mint)] text-[color:var(--color-ink)]',
}

const fallbackLabel = computed(() => (props.name ? getInitials(props.name) : '?'))
const resolvedAlt = computed(() => props.alt || props.name || 'Avatar')
</script>

<template>
    <span
        :class="[
            'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold leading-none',
            SIZE_CLASSES[size],
            TONE_CLASSES[tone],
        ]"
    >
        <img
            v-if="src"
            :src="src"
            :alt="resolvedAlt"
            class="size-full object-cover"
        />
        <span v-else>{{ fallbackLabel }}</span>
    </span>
</template>
