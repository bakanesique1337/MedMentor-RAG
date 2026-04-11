<script setup lang="ts">
import { type Component, computed } from 'vue'

import VErrorIcon from '@/components/icons/VErrorIcon.vue'
import VInfoIcon from '@/components/icons/VInfoIcon.vue'
import VSuccessIcon from '@/components/icons/VSuccessIcon.vue'
import VWarningIcon from '@/components/icons/VWarningIcon.vue'
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
    info: 'border-info-border bg-info-surface text-info-text',
    success: 'border-success-border bg-success-surface text-success-text',
    warning: 'border-warning-border bg-warning-surface text-warning-text',
    error: 'border-error-border bg-error-surface text-error-text',
}

const STATUS_ICON: Record<AlertStatus, Component> = {
    info: VInfoIcon,
    success: VSuccessIcon,
    warning: VWarningIcon,
    error: VErrorIcon,
}

const alertClassName = computed(() => cn(
    'flex items-start gap-2 squircle squircle-md border px-3 py-2',
    STATUS_CLASSES[props.status],
    props.class,
))
</script>

<template>
    <div
        :class="alertClassName"
        role="alert"
    >
        <span
            class="mt-[0.1rem] inline-flex size-[2rem] shrink-0 items-center justify-center squircle squircle-sm border border-current/20"
            aria-hidden="true"
        >
            <component :is="STATUS_ICON[status]"/>
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
            <slot name="action"/>
        </div>
    </div>
</template>
