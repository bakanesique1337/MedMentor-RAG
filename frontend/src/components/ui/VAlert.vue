<script setup lang="ts">
import { computed } from 'vue'

import { cn } from '@/components/ui/utils'

type AlertStatus = 'info' | 'success' | 'warning' | 'error'

interface Props {
    status?: AlertStatus
    title?: string
    description?: string
    class?: string
}

const props = withDefaults(defineProps<Props>(), {
    status: 'info',
    title: '',
    description: '',
    class: '',
})

const STATUS_CLASSES: Record<AlertStatus, string> = {
    info: 'border-[color:var(--color-teal-soft)] bg-brand-ghost text-brand-deep',
    success: 'border-[color:var(--color-teal-soft)] bg-brand-ghost text-brand-deep',
    warning: 'border-[color:rgb(181_138_78_/_0.3)] bg-[color:var(--color-amber-soft)] text-[color:var(--color-amber-text)]',
    error: 'border-[color:rgb(138_46_32_/_0.3)] bg-[color:var(--color-rose-soft)] text-[color:var(--color-rose-text)]',
}

const alertClass = computed(() =>
    cn(
        'flex items-start gap-[1.2rem] rounded-[1rem] border px-[1.6rem] py-[1.2rem]',
        STATUS_CLASSES[props.status],
        props.class,
    ),
)
</script>

<template>
    <div
        :class="alertClass"
        role="alert"
    >
        <div class="min-w-0 flex-1 space-y-[0.4rem]">
            <p
                v-if="title || $slots.title"
                class="text-[1.35rem] font-semibold"
            >
                <slot name="title">{{ title }}</slot>
            </p>
            <div class="text-[1.3rem]">
                <slot>{{ description }}</slot>
            </div>
        </div>
        <div
            v-if="$slots.action"
            class="shrink-0"
        >
            <slot name="action" />
        </div>
    </div>
</template>
