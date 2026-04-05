<script setup lang="ts">
import { computed } from 'vue'

import { getInitials } from '@/components/ui/utils'

type AvatarSize = 'sm' | 'md' | 'lg'

interface Props {
    name?: string
    src?: string
    alt?: string
    size?: AvatarSize
}

const props = withDefaults(defineProps<Props>(), {
    name: '',
    src: '',
    alt: '',
    size: 'md',
})

const sizeClasses = computed<Record<AvatarSize, string>>(() => ({
    sm: 'size-[3.2rem] text-label',
    md: 'size-[4rem] text-body-sm',
    lg: 'size-[5.6rem] text-body',
}))

const fallbackLabel = computed(() => {
    if (props.name) {
        return getInitials(props.name)
    }

    return '?'
})

const resolvedAlt = computed(() => props.alt || props.name || 'Avatar')
</script>

<template>
    <span
        :class="[
            'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-default bg-surface-sunken font-semibold text-text-secondary',
            sizeClasses[size],
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
