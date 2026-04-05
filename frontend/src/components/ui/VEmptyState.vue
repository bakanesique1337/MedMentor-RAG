<script setup lang="ts">
import { computed } from 'vue'

import { cn } from '@/components/ui/utils'

interface Props {
    title?: string
    description?: string
    compact?: boolean
    class?: string
}

const props = withDefaults(defineProps<Props>(), {
    title: '',
    description: '',
    compact: false,
    class: '',
})

const wrapperClassName = computed(() => cn(
    'rounded-2xl border border-dashed border-border-default bg-surface-elevated text-center',
    props.compact ? 'px-4 py-4' : 'px-5 py-6',
    props.class,
))
</script>

<template>
    <section :class="wrapperClassName">
        <div
            v-if="$slots.illustration"
            class="mx-auto mb-3 inline-flex size-[5.6rem] items-center justify-center rounded-full bg-surface-sunken text-text-secondary"
        >
            <slot name="illustration" />
        </div>

        <h2 class="text-h3 font-semibold text-text-primary">
            <slot name="title">
                {{ title }}
            </slot>
        </h2>

        <p
            v-if="description || $slots.default"
            class="mx-auto mt-1 max-w-prose text-body text-text-secondary"
        >
            <slot>
                {{ description }}
            </slot>
        </p>

        <div
            v-if="$slots.action"
            class="mt-3 flex justify-center"
        >
            <slot name="action" />
        </div>
    </section>
</template>
