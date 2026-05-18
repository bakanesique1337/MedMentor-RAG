<script setup lang="ts">
interface Props {
    label: string
    active?: boolean
    badge?: number | string | null
}

withDefaults(defineProps<Props>(), {
    active: false,
    badge: null,
})

defineEmits<{
    click: []
}>()
</script>

<template>
    <button
        type="button"
        class="flex w-full items-center gap-4 rounded-[0.6rem] px-4 py-[0.8rem] text-left text-[1.3rem] transition"
        :class="active
            ? 'bg-[rgb(63_185_179/0.12)] text-dark-ink font-medium border-l-[0.2rem] border-dark-teal'
            : 'text-dark-ink-2 hover:bg-[rgb(63_185_179/0.06)] hover:text-dark-ink border-l-[0.2rem] border-transparent'"
        @click="$emit('click')"
    >
        <span
            class="flex w-[1.6rem] items-center justify-center"
            :class="active ? 'text-dark-teal' : ''"
        >
            <slot name="icon" />
        </span>
        <span class="flex-1">{{ label }}</span>
        <span
            v-if="badge !== null"
            class="font-mono text-[1.05rem] tabular text-dark-ink-3"
        >
            {{ badge }}
        </span>
    </button>
</template>