<script setup lang="ts">
import { computed } from 'vue'

type ChipTone = 'neutral' | 'teal' | 'amber' | 'rose'

interface Props {
    label: string
    value: string
    sub?: string
    chip?: string
    chipTone?: ChipTone
}

const props = withDefaults(defineProps<Props>(), {
    sub: undefined,
    chip: undefined,
    chipTone: 'neutral',
})

const CHIP_CLASSES: Record<ChipTone, string> = {
    neutral: 'bg-[color:rgb(10_31_31_/_0.05)] text-text-secondary',
    teal: 'bg-brand-ghost text-brand',
    amber: 'bg-[color:var(--color-amber-soft)] text-[color:var(--color-amber-text)]',
    rose: 'bg-[color:var(--color-rose-soft)] text-[color:var(--color-rose-text)]',
}

const chipClass = computed<string>(() => CHIP_CLASSES[props.chipTone])
</script>

<template>
    <div class="flex min-h-[12.8rem] min-w-0 flex-col rounded-[1.4rem] border border-[color:var(--color-line)] bg-white px-[1.6rem] pb-[1.4rem] pt-[1.6rem]">
        <div class="mb-[1rem] flex items-center justify-between gap-[0.8rem]">
            <span class="truncate text-eyebrow text-text-tertiary">
                {{ label }}
            </span>
            <span
                v-if="chip"
                class="shrink-0 rounded-[0.4rem] px-[0.6rem] py-[0.2rem] font-mono text-[1rem] font-semibold tracking-[0.06em]"
                :class="chipClass"
            >
                {{ chip }}
            </span>
        </div>

        <div class="flex flex-1 items-baseline gap-[0.6rem] font-serif text-[4rem] font-medium leading-none tracking-[-0.025em] text-text-primary">
            {{ value }}
            <span
                v-if="sub"
                class="font-sans text-[1.4rem] font-normal text-text-tertiary"
                style="letter-spacing: 0;"
            >{{ sub }}</span>
        </div>

        <div
            v-if="$slots.footer"
            class="mt-[1.4rem]"
        >
            <slot name="footer" />
        </div>
    </div>
</template>
