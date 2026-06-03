<script setup lang="ts">
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import { ref } from 'vue'

interface Props {
    align?: 'left' | 'right'
}

withDefaults(defineProps<Props>(), {
    align: 'right',
})

const rootRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)

function toggle(): void {
    isOpen.value = !isOpen.value
}

function close(): void {
    isOpen.value = false
}

onClickOutside(rootRef, () => {
    if (isOpen.value) close()
})

onKeyStroke('Escape', () => {
    if (isOpen.value) close()
})
</script>

<template>
    <div
        ref="rootRef"
        class="relative inline-block"
    >
        <div @click="toggle">
            <slot
                name="trigger"
                :is-open="isOpen"
                :toggle="toggle"
            />
        </div>
        <div
            v-if="isOpen"
            class="absolute top-[calc(100%+0.6rem)] z-[90] min-w-[20rem] overflow-hidden rounded-[1rem] border border-[color:var(--color-line-2)] bg-white p-[0.6rem] shadow-[0_20px_40px_-20px_rgb(10_31_31_/_0.3)]"
            :class="align === 'right' ? 'right-0' : 'left-0'"
        >
            <slot
                :close="close"
            />
        </div>
    </div>
</template>
