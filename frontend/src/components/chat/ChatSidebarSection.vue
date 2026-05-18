<script setup lang="ts">
interface Props {
    label: string
}

defineProps<Props>()
</script>

<template>
    <section class="mb-[1.8rem]">
        <div class="mb-[0.6rem] flex items-baseline justify-between">
            <p class="text-eyebrow-sm font-mono uppercase text-dark-ink-3">
                {{ label }}
            </p>
            <slot name="aside"/>
        </div>
        <div class="rounded-[0.8rem] border border-dark-line bg-dark-raised px-[1.2rem] py-4">
            <slot/>
        </div>
    </section>
</template>