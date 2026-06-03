<script setup lang="ts">
import { ref } from 'vue'

interface Props {
    text?: string
}

withDefaults(defineProps<Props>(), {
    text: '',
})

const show = ref(false)
</script>

<template>
    <span
        class="relative inline-flex"
        @mouseenter="show = true"
        @mouseleave="show = false"
        @focusin="show = true"
        @focusout="show = false"
    >
        <slot />
        <span
            v-if="show && text"
            class="pointer-events-none absolute bottom-[calc(100%+0.6rem)] left-1/2 z-[200] -translate-x-1/2 whitespace-nowrap rounded-[0.6rem] bg-[color:var(--color-ink)] px-[1rem] py-[0.5rem] text-[1.15rem] text-[color:var(--color-dark-ink)] shadow-[0_6px_16px_-8px_rgb(10_31_31_/_0.4)]"
        >
            {{ text }}
        </span>
    </span>
</template>
