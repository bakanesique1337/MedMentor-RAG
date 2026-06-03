<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    label: string
    note: string | null
    /** 0..100 */
    value: number
    isLast: boolean
}

const props = defineProps<Props>()

const tone = computed<'good' | 'warn' | 'bad'>(() => {
    if (props.value >= 80) return 'good'
    if (props.value >= 60) return 'warn'
    return 'bad'
})

const barClass = computed(() => {
    switch (tone.value) {
        case 'good':
            return 'bg-brand'
        case 'warn':
            return 'bg-[color:var(--color-amber)]'
        case 'bad':
        default:
            return 'bg-[color:var(--color-danger-bright)]'
    }
})

const valueClass = computed(() => {
    switch (tone.value) {
        case 'good':
            return 'text-brand'
        case 'warn':
            return 'text-[color:var(--color-amber-text)]'
        case 'bad':
        default:
            return 'text-[color:var(--color-danger-bright)]'
    }
})
</script>

<template>
    <div
        class="grid grid-cols-[1fr_6.4rem] items-center gap-[1.4rem] px-[1.6rem] py-[1.2rem]"
        :class="isLast ? '' : 'border-b border-[color:rgb(10_31_31_/_0.06)]'"
    >
        <div>
            <p class="mb-[0.4rem] text-[1.35rem] font-medium text-text-primary">
                {{ label }}
            </p>
            <p
                v-if="note"
                class="text-[1.2rem] leading-[1.45] text-text-secondary"
            >
                {{ note }}
            </p>
            <div class="mt-[0.6rem] h-[0.3rem] overflow-hidden rounded-[0.2rem] bg-[color:rgb(10_31_31_/_0.06)]">
                <div
                    class="h-full transition-[width] duration-700 ease-out"
                    :class="barClass"
                    :style="{ width: `${value}%` }"
                />
            </div>
        </div>
        <p
            class="text-right font-serif text-[2.2rem] font-medium leading-none tabular"
            :class="valueClass"
        >
            {{ value }}
        </p>
    </div>
</template>
