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

const statusClasses = computed<Record<AlertStatus, string>>(() => ({
    info: 'border-info-border bg-info-surface text-info-text',
    success: 'border-success-border bg-success-surface text-success-text',
    warning: 'border-warning-border bg-warning-surface text-warning-text',
    error: 'border-error-border bg-error-surface text-error-text',
}))

const iconMap = computed<Record<AlertStatus, string>>(() => ({
    info: 'i',
    success: '!',
    warning: '!',
    error: 'x',
}))

const alertClassName = computed(() => cn(
    'flex items-start gap-2 rounded-xl border px-3 py-2',
    statusClasses.value[props.status],
    props.class,
))
</script>

<template>
    <div
        :class="alertClassName"
        role="alert"
    >
        <span
            class="mt-[0.2rem] inline-flex size-[2rem] shrink-0 items-center justify-center rounded-full border border-current/20 text-label font-bold uppercase"
            aria-hidden="true"
        >
            {{ iconMap[status] }}
        </span>

        <div class="min-w-0 flex-1 space-y-1">
            <p
                v-if="title || $slots.title"
                class="text-body-sm font-semibold"
            >
                <slot name="title">
                    {{ title }}
                </slot>
            </p>

            <div class="text-body-sm">
                <slot>
                    {{ description }}
                </slot>
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
