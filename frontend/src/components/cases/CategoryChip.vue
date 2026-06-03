<script setup lang="ts">
interface Props {
    label: string
    count: number
    active: boolean
}

defineProps<Props>()

const emit = defineEmits<{
    click: []
}>()

/**
 * Forwards the click event so the parent can manage selection state.
 */
function handleClick(): void {
    emit('click')
}
</script>

<template>
    <button
        type="button"
        class="inline-flex h-[3.4rem] select-none items-center gap-[0.8rem] rounded-full border px-[1.4rem] text-[1.3rem] transition-colors duration-150"
        :class="active
            ? 'border-[color:var(--color-dark-bg)] bg-[color:var(--color-dark-bg)] font-medium text-[color:var(--color-dark-ink)]'
            : 'border-[color:var(--color-line-2)] bg-white text-text-primary hover:border-[color:var(--color-teal)]'"
        @click="handleClick"
    >
        <span>{{ label }}</span>
        <span
            class="font-mono tabular text-[1.05rem] tracking-[0.04em]"
            :class="active ? 'text-[color:var(--color-dark-ink-2)]' : 'text-text-tertiary'"
        >{{ count }}</span>
    </button>
</template>
