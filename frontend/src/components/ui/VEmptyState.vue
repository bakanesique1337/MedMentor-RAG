<script setup lang="ts">
interface Props {
    title?: string
    description?: string
}

withDefaults(defineProps<Props>(), {
    title: '',
    description: '',
})
</script>

<template>
    <div class="flex flex-col items-center justify-center rounded-[1.4rem] border border-dashed border-[color:var(--color-line-2)] bg-surface-base px-[3rem] py-[5rem] text-center">
        <h3
            v-if="title || $slots.title"
            class="font-serif text-[2rem] font-medium leading-[1.2] tracking-[-0.02em] text-text-primary"
        >
            <slot name="title">{{ title }}</slot>
        </h3>
        <p
            v-if="description || $slots.description"
            class="mt-[0.8rem] max-w-[42rem] text-[1.35rem] text-text-secondary"
        >
            <slot name="description">{{ description }}</slot>
        </p>
        <div
            v-if="$slots.action"
            class="mt-[2rem]"
        >
            <slot name="action" />
        </div>
    </div>
</template>
