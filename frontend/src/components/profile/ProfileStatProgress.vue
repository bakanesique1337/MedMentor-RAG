<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    value: number
    max?: number
    color?: string
}

const props = withDefaults(defineProps<Props>(), {
    max: 100,
    color: 'var(--brand-primary)',
})

const pct = computed<number>(() => {
    if (props.max <= 0) return 0
    return Math.max(0, Math.min(100, (props.value / props.max) * 100))
})
</script>

<template>
    <div class="h-[0.4rem] overflow-hidden rounded-[0.2rem] bg-[color:rgb(10_31_31_/_0.06)]">
        <div
            class="h-full rounded-[0.2rem] transition-[width] duration-[400ms]"
            :style="{ width: `${pct}%`, background: color }"
        />
    </div>
</template>
