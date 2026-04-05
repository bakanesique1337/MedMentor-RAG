<script setup lang="ts">
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import { computed, ref, useId, watch } from 'vue'

import { cn } from '@/components/ui/utils'

interface Props {
    modelValue?: boolean
    align?: 'start' | 'end'
    width?: 'sm' | 'md' | 'lg'
    closeOnSelect?: boolean
    rootClass?: string
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    align: 'end',
    width: 'md',
    closeOnSelect: true,
    rootClass: '',
})

const emit = defineEmits<{
    (event: 'update:modelValue', value: boolean): void
}>()

const dropdownId = useId()
const rootRef = ref<HTMLElement | null>(null)
const buttonRef = ref<HTMLButtonElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)

const isOpen = computed({
    get: () => props.modelValue,
    set: (value: boolean) => emit('update:modelValue', value),
})

const widthClasses = computed<Record<NonNullable<Props['width']>, string>>(() => ({
    sm: 'min-w-[16rem]',
    md: 'min-w-[22rem]',
    lg: 'min-w-[28rem]',
}))

watch(isOpen, (value) => {
    if (!value) {
        buttonRef.value?.focus()
    }
})

onClickOutside(rootRef, () => {
    if (isOpen.value) {
        isOpen.value = false
    }
})

onKeyStroke('Escape', (event) => {
    if (!isOpen.value) {
        return
    }

    event.preventDefault()
    isOpen.value = false
})

function toggleDropdown(): void {
    isOpen.value = !isOpen.value
}

function closeDropdown(): void {
    isOpen.value = false
}
</script>

<template>
    <div
        ref="rootRef"
        class="relative inline-flex"
    >
        <button
            :id="`dropdown-trigger-${dropdownId}`"
            ref="buttonRef"
            type="button"
            :aria-expanded="isOpen"
            :aria-controls="`dropdown-panel-${dropdownId}`"
            class="inline-flex"
            @click="toggleDropdown"
        >
            <slot
                name="trigger"
                :open="isOpen"
            />
        </button>

        <div
            v-if="isOpen"
            :id="`dropdown-panel-${dropdownId}`"
            ref="panelRef"
            :class="cn(
                'absolute top-[calc(100%+0.8rem)] z-dropdown rounded-xl border border-border-default bg-surface-elevated p-1 shadow-md',
                align === 'end' ? 'right-0' : 'left-0',
                widthClasses[width],
                props.rootClass,
            )"
            role="menu"
            :aria-labelledby="`dropdown-trigger-${dropdownId}`"
            @click="closeOnSelect ? closeDropdown() : undefined"
        >
            <slot
                :open="isOpen"
                :close="closeDropdown"
            />
        </div>
    </div>
</template>
