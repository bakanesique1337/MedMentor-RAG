<script setup lang="ts">
import { computed } from 'vue'

type Variant = 'student-match' | 'student-miss' | 'reference'

interface Props {
    label: string
    text: string
    confidence?: number | null
    variant: Variant
}

const props = defineProps<Props>()

const tintClass = computed(() => {
    switch (props.variant) {
        case 'student-miss':
            return 'bg-[color:var(--color-rose-soft)]'
        case 'reference':
        case 'student-match':
        default:
            return 'bg-[color:var(--color-teal-ghost)]'
    }
})

const borderClass = computed(() => {
    if (props.variant === 'student-miss') {
        return 'border-[color:rgb(196_74_56_/_0.3)]'
    }
    return 'border-[color:rgb(13_115_119_/_0.25)]'
})

const labelClass = computed(() => {
    if (props.variant === 'reference') return 'text-brand'
    return 'text-text-secondary'
})

const isStudent = computed(() => props.variant !== 'reference')
const isMatch = computed(() => props.variant === 'student-match')
</script>

<template>
    <div
        class="relative overflow-hidden rounded-[1.2rem] border bg-white px-[1.6rem] py-[1.4rem]"
        :class="borderClass"
    >
        <div
            class="absolute inset-x-0 top-0 h-[0.3rem]"
            :class="tintClass"
            aria-hidden="true"
        />

        <div
            class="mb-[0.6rem] flex items-center gap-[0.8rem] text-eyebrow-sm"
            :class="labelClass"
        >
            <template v-if="isStudent">
                <span
                    v-if="isMatch"
                    class="flex size-[1.4rem] items-center justify-center rounded-full bg-brand text-white"
                >
                    <svg
                        width="10"
                        height="10"
                        viewBox="0 0 14 14"
                    ><path
                        d="M4 7l2 2 4-5"
                        stroke="currentColor"
                        stroke-width="1.6"
                        fill="none"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    /></svg>
                </span>
                <span
                    v-else
                    class="flex size-[1.4rem] items-center justify-center rounded-full bg-[color:var(--color-danger-bright)] text-white"
                >
                    <svg
                        width="10"
                        height="10"
                        viewBox="0 0 14 14"
                    ><path
                        d="M5 5l4 4M9 5l-4 4"
                        stroke="currentColor"
                        stroke-width="1.6"
                        stroke-linecap="round"
                    /></svg>
                </span>
            </template>
            {{ label }}
        </div>

        <p class="font-serif text-[1.6rem] leading-[1.3] text-text-primary">
            {{ text }}
        </p>

        <p
            v-if="confidence !== undefined && confidence !== null"
            class="mt-[0.8rem] font-mono text-[1.05rem] tracking-[0.04em] text-text-secondary tabular"
        >
            УВЕРЕННОСТЬ · {{ confidence }}%
        </p>
    </div>
</template>
