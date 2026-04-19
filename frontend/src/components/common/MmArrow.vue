<script setup lang="ts">
interface Props {
    size?: number
    strokeWidth?: number
}

withDefaults(defineProps<Props>(), {
    size: 14,
    strokeWidth: 1.6,
})
</script>

<template>
    <svg
        :width="size"
        :height="size"
        viewBox="0 0 14 14"
        fill="none"
        aria-hidden="true"
    >
        <path
            d="M2 7h10M8 3l4 4-4 4"
            stroke="currentColor"
            :stroke-width="strokeWidth"
            stroke-linecap="round"
            stroke-linejoin="round"
        />
    </svg>
</template>
