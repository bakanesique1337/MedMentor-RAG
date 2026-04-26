<script setup lang="ts">
interface Props {
    eyebrow: string
    title: string
    hint?: string
}

defineProps<Props>()
</script>

<template>
    <div class="mb-[1.6rem] mt-[0.4rem] flex items-end justify-between gap-[1.6rem]">
        <div class="min-w-0">
            <p class="mb-[0.6rem] text-eyebrow text-brand">{{ eyebrow }}</p>
            <h2 class="font-serif text-[2.8rem] font-medium leading-none tracking-[-0.02em] text-text-primary">
                {{ title }}
            </h2>
            <p
                v-if="hint"
                class="mt-[0.6rem] text-[1.25rem] text-text-secondary"
            >
                {{ hint }}
            </p>
        </div>
        <div
            v-if="$slots.action"
            class="shrink-0"
        >
            <slot name="action" />
        </div>
    </div>
</template>
