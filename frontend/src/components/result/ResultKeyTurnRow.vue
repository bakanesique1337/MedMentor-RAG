<script setup lang="ts">
import { computed } from 'vue'

import type { KeyTurn } from '@/types'

interface Props {
    turn: KeyTurn
    isLast: boolean
}

const props = defineProps<Props>()

const tagClass = computed(() => {
    if (props.turn.kind === 'warn') {
        return 'bg-[color:var(--color-amber-soft)] text-[color:var(--color-amber-text)]'
    }
    return 'bg-brand-ghost text-brand-deep'
})

const turnLabel = computed(() => String(props.turn.turn).padStart(2, '0'))
</script>

<template>
    <div
        class="flex items-center gap-[1.2rem] px-[1.6rem] py-[1rem]"
        :class="isLast ? '' : 'border-b border-[color:rgb(10_31_31_/_0.06)]'"
    >
        <span class="flex size-[2.6rem] shrink-0 items-center justify-center rounded-full bg-[color:rgb(10_31_31_/_0.04)] font-mono text-[1.05rem] font-semibold text-text-secondary">
            {{ turnLabel }}
        </span>
        <p class="flex-1 text-[1.3rem] leading-[1.45] text-text-primary">
            {{ turn.text }}
        </p>
        <span
            class="rounded-[0.4rem] px-[0.9rem] py-[0.3rem] font-mono text-[1.05rem] font-semibold uppercase tracking-[0.1em]"
            :class="tagClass"
        >
            {{ turn.tag }}
        </span>
    </div>
</template>
