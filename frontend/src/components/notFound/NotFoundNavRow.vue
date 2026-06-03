<script setup lang="ts">
defineOptions({name: 'NotFoundNavRow'})

import VChevronIcon from '@/components/icons/VChevronIcon.vue'

interface Props {
    title: string
    subtitle?: string
    isLast?: boolean
}

const {title, subtitle, isLast = false} = defineProps<Props>()

defineEmits<{
    (e: 'click'): void
}>()
</script>

<template>
    <li
        class="dx-row"
        :class="isLast ? '' : 'border-b border-(--color-line)'"
    >
        <button
            type="button"
            class="group flex w-full items-center gap-[1.2rem] py-4 text-left transition-[padding] duration-140"
            @click="$emit('click')"
        >
            <span
                class="inline-flex h-[2.8rem] w-[2.8rem] shrink-0 items-center justify-center rounded-sm bg-brand-ghost text-brand"
            >
                <slot name="icon"/>
            </span>

            <span class="min-w-0 flex-1">
                <span class="block text-[1.3rem] font-medium text-text-primary">{{ title }}</span>
                <span
                    v-if="subtitle"
                    class="mt-[0.1rem] block text-[1.15rem] text-text-tertiary"
                >{{ subtitle }}</span>
            </span>

            <span
                class="dx-arrow text-[rgb(10_31_31/0.18)] transition-[color,transform] duration-140 group-hover:text-brand"
            >
                <VChevronIcon/>
            </span>
        </button>
    </li>
</template>

<style scoped>
.dx-row .group:hover {
    padding-left: 0.4rem;
}

.dx-row .group:hover .dx-arrow {
    transform: translateX(0.2rem);
}
</style>