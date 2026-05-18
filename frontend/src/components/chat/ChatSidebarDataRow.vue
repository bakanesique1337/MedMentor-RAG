<script setup lang="ts">
interface Props {
    label: string
    alert?: boolean
    mono?: boolean
}

withDefaults(defineProps<Props>(), {
    alert: false,
    mono: false,
})
</script>

<template>
    <div
        class="flex items-baseline justify-between border-b border-dark-line py-[0.4rem] text-[1.15rem] last:border-b-0"
    >
        <span class="text-dark-ink-2">{{ label }}</span>
        <span
            class="text-right font-medium"
            :class="[
                alert ? 'text-(--color-amber)' : 'text-dark-ink',
                mono ? 'font-mono' : '',
            ]"
        >
            <slot/>
        </span>
    </div>
</template>