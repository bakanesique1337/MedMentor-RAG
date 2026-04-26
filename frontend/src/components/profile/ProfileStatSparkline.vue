<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    data: readonly number[]
    color?: string
    height?: number
}

const props = withDefaults(defineProps<Props>(), {
    color: 'var(--brand-primary)',
    height: 18,
})

const VIEW_WIDTH = 100

const points = computed<string>(() => {
    if (props.data.length === 0) return ''
    const max = Math.max(...props.data, 1)
    const step = VIEW_WIDTH / Math.max(props.data.length - 1, 1)
    return props.data
        .map((value, i) => {
            const x = i * step
            const y = props.height - (value / max) * (props.height - 2) - 1
            return `${x},${y}`
        })
        .join(' ')
})
</script>

<template>
    <svg
        class="block w-full"
        :height="height"
        :viewBox="`0 0 ${VIEW_WIDTH} ${height}`"
        preserveAspectRatio="none"
        aria-hidden="true"
    >
        <polyline
            :points="points"
            fill="none"
            :stroke="color"
            stroke-width="1.2"
            stroke-linejoin="round"
            stroke-linecap="round"
            vector-effect="non-scaling-stroke"
        />
    </svg>
</template>
