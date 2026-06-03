<script setup lang="ts">
import { computed } from 'vue'

type SkeletonShape = 'rectangle' | 'circle' | 'text'

interface Props {
    width?: string
    height?: string
    shape?: SkeletonShape
}

const props = withDefaults(defineProps<Props>(), {
    width: '100%',
    height: '1.2rem',
    shape: 'rectangle',
})

const style = computed(() => ({
    width: props.width,
    height: props.height,
    borderRadius: props.shape === 'circle' ? '9999px' : props.shape === 'text' ? '0.4rem' : '0.8rem',
}))
</script>

<template>
    <div
        class="skeleton"
        :style="style"
    />
</template>
