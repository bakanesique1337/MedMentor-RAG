<script setup lang="ts">
import { computed } from 'vue'

import { avatarGradient, DEFAULT_AVATAR_VARIANT } from '@/constants/avatar'
import type { AvatarVariant } from '@/types'

interface Props {
    name: string
    size?: number
    variant?: AvatarVariant
}

const props = withDefaults(defineProps<Props>(), {
    size: 120,
    variant: DEFAULT_AVATAR_VARIANT,
})

const initials = computed<string>(() => {
    const parts = props.name.trim().split(/\s+/).slice(0, 2)
    const letters = parts.map((p) => p[0] ?? '').join('')
    return letters.toUpperCase() || 'У'
})

const containerStyle = computed(() => {
    const radius = props.size * 0.16

    return {
        width: `${props.size / 10}rem`,
        height: `${props.size / 10}rem`,
        background: avatarGradient(props.variant),
        borderRadius: `${radius / 10}rem`,
    }
})

const initialsStyle = computed(() => ({
    fontSize: `${(props.size * 0.38) / 10}rem`,
}))
</script>

<template>
    <div
        class="relative flex shrink-0 items-center justify-center overflow-hidden"
        :style="containerStyle"
        style="box-shadow: 0 1.2rem 3.2rem rgb(8 72 75 / 16%), inset 0 0 0 0.1rem rgb(255 255 255 / 50%);"
        aria-hidden="true"
    >
        <svg
            class="absolute inset-0 size-full"
            viewBox="0 0 120 120"
            preserveAspectRatio="xMidYMid slice"
            style="opacity: 0.28;"
        >
            <circle
                cx="20"
                cy="100"
                r="70"
                fill="none"
                stroke="rgb(255 255 255 / 0.65)"
                stroke-width="0.6"
            />
            <circle
                cx="100"
                cy="20"
                r="50"
                fill="none"
                stroke="rgb(255 255 255 / 0.55)"
                stroke-width="0.6"
            />
            <circle
                cx="60"
                cy="60"
                r="28"
                fill="none"
                stroke="rgb(0 0 0 / 0.12)"
                stroke-width="0.6"
            />
        </svg>
        <span
            class="relative font-serif font-medium leading-none tracking-[-0.04em] text-white/95"
            :style="initialsStyle"
            style="text-shadow: 0 0.2rem 0.6rem rgb(0 0 0 / 10%);"
        >{{ initials }}</span>
    </div>
</template>
