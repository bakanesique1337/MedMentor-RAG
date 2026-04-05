<script setup lang="ts">
import { computed } from 'vue'

import { cn } from '@/components/ui/utils'

type SkeletonShape = 'line' | 'rectangle' | 'circle'

interface Props {
    shape?: SkeletonShape
    width?: string
    height?: string
    shimmer?: boolean
    rootClass?: string
}

const props = withDefaults(defineProps<Props>(), {
    shape: 'line',
    width: '100%',
    height: '',
    shimmer: true,
    rootClass: '',
})

const shapeClasses = computed<Record<SkeletonShape, string>>(() => ({
    line: 'h-[1.2rem] rounded-full',
    rectangle: 'rounded-lg',
    circle: 'rounded-full',
}))

const resolvedHeight = computed(() => {
    if (props.height) {
        return props.height
    }

    if (props.shape === 'circle') {
        return props.width
    }

    return props.shape === 'rectangle' ? '8rem' : '1.2rem'
})

const skeletonStyle = computed(() => ({
    width: props.width,
    height: resolvedHeight.value,
}))
</script>

<template>
    <span
        :class="cn(
            'block bg-skeleton-base',
            props.shimmer ? 'animate-skeleton-shimmer' : '',
            shapeClasses[shape],
            props.rootClass,
        )"
        :style="skeletonStyle"
        aria-hidden="true"
    />
</template>
