<script setup lang="ts">
interface Props {
    label: string
}

defineProps<Props>()
</script>

<template>
    <div class="flex-1 rounded-[0.8rem] border border-dark-line bg-dark-raised px-4 py-[0.8rem]">
        <p class="mb-[0.4rem] text-eyebrow-sm font-mono uppercase text-dark-ink-2">
            {{ label }}
        </p>
        <slot/>
    </div>
</template>