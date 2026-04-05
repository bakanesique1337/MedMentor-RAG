<script setup lang="ts">
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import { computed, ref, useId } from 'vue'

import { cn } from '@/components/ui/utils'

interface Props {
    text?: string
    position?: 'top' | 'bottom'
    modelValue?: boolean
    rootClass?: string
}

const props = withDefaults(defineProps<Props>(), {
    text: '',
    position: 'top',
    modelValue: false,
    rootClass: '',
})

const emit = defineEmits<{
    (event: 'update:modelValue', value: boolean): void
}>()

const tooltipId = useId()
const rootRef = ref<HTMLElement | null>(null)
const isOpen = computed({
    get: () => props.modelValue,
    set: (value: boolean) => emit('update:modelValue', value),
})

onClickOutside(rootRef, () => {
    if (isOpen.value) {
        isOpen.value = false
    }
})

onKeyStroke('Escape', () => {
    if (isOpen.value) {
        isOpen.value = false
    }
})

function openTooltip(): void {
    isOpen.value = true
}

function closeTooltip(): void {
    isOpen.value = false
}

function toggleTooltip(): void {
    isOpen.value = !isOpen.value
}
</script>

<template>
    <span
        ref="rootRef"
        class="relative inline-flex"
        @mouseenter="openTooltip"
        @mouseleave="closeTooltip"
    >
        <button
            type="button"
            :aria-expanded="isOpen"
            :aria-describedby="isOpen ? `tooltip-${tooltipId}` : undefined"
            class="inline-flex"
            @focus="openTooltip"
            @blur="closeTooltip"
            @click="toggleTooltip"
        >
            <slot />
        </button>

        <span
            v-if="isOpen"
            :id="`tooltip-${tooltipId}`"
            :class="cn(
                'absolute left-1/2 z-tooltip w-max max-w-[24rem] -translate-x-1/2 rounded-lg bg-slate-900 px-2 py-1 text-body-sm text-white shadow-md',
                position === 'top' ? 'bottom-[calc(100%+0.8rem)]' : 'top-[calc(100%+0.8rem)]',
                props.rootClass,
            )"
            role="tooltip"
        >
            <slot name="content">
                {{ text }}
            </slot>
        </span>
    </span>
</template>
