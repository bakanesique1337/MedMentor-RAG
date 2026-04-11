<script setup lang="ts">
import { onClickOutside, onKeyStroke, useScrollLock } from '@vueuse/core'
import { computed, nextTick, ref, watch } from 'vue'

import VButton from '@/components/ui/VButton.vue'
import { cn } from '@/components/ui/utils'

interface Props {
    modelValue?: boolean
    closeOnBackdrop?: boolean
    closeOnEscape?: boolean
    title?: string
    description?: string
    rootClass?: string
    fullscreen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    closeOnBackdrop: true,
    closeOnEscape: true,
    title: '',
    description: '',
    rootClass: '',
    fullscreen: false,
})

const emit = defineEmits<{
    (event: 'update:modelValue', value: boolean): void
    (event: 'close'): void
}>()

const panelRef = ref<HTMLElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const isOpen = computed({
    get: () => props.modelValue,
    set: (value: boolean) => {
        emit('update:modelValue', value)

        if (!value) {
            emit('close')
        }
    },
})

const scrollLocked = useScrollLock(containerRef)
let lastActiveElement: HTMLElement | null = null

watch(isOpen, async (value) => {
    scrollLocked.value = value

    if (!value) {
        lastActiveElement?.focus()
        lastActiveElement = null
        return
    }

    if (document.activeElement instanceof HTMLElement) {
        lastActiveElement = document.activeElement
    }

    await nextTick()
    focusFirstElement()
})

onClickOutside(panelRef, () => {
    if (props.closeOnBackdrop && isOpen.value) {
        isOpen.value = false
    }
})

onKeyStroke('Escape', (event) => {
    if (!props.closeOnEscape || !isOpen.value) {
        return
    }

    event.preventDefault()
    isOpen.value = false
})

function focusFirstElement(): void {
    if (!panelRef.value) {
        return
    }

    const focusableElements = panelRef.value.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )

    const firstFocusable = focusableElements[0]

    if (firstFocusable) {
        firstFocusable.focus()
        return
    }

    panelRef.value.focus()
}
</script>

<template>
    <Teleport to="body">
        <div
            v-if="isOpen"
            ref="containerRef"
            :class="props.fullscreen
                ? 'fixed inset-0 z-modal flex flex-col bg-surface-elevated'
                : 'fixed inset-0 z-modal flex items-center justify-center bg-surface-overlay px-2 py-3'"
        >
            <div
                ref="panelRef"
                :class="cn(
                    props.fullscreen
                        ? 'flex flex-1 flex-col overflow-hidden'
                        : 'relative w-full max-w-[56rem] rounded-2xl border border-border-default bg-surface-elevated shadow-overlay',
                    props.rootClass,
                )"
                role="dialog"
                aria-modal="true"
                :aria-label="title || undefined"
                tabindex="-1"
            >
                <div class="flex items-start justify-between gap-2 border-b border-border-subtle px-3 py-2">
                    <div class="space-y-0.5">
                        <h2
                            v-if="title || $slots.title"
                            class="text-h2 font-semibold text-text-primary"
                        >
                            <slot name="title">
                                {{ title }}
                            </slot>
                        </h2>

                        <p
                            v-if="description || $slots.description"
                            class="text-body-sm text-text-secondary"
                        >
                            <slot name="description">
                                {{ description }}
                            </slot>
                        </p>
                    </div>

                    <VButton
                        variant="ghost"
                        size="sm"
                        aria-label="Close modal"
                        @click="isOpen = false"
                    >
                        Close
                    </VButton>
                </div>

                <div
                    :class="props.fullscreen
                        ? 'flex flex-1 items-center justify-center overflow-auto px-3 py-6'
                        : 'px-3 py-3'"
                >
                    <div :class="props.fullscreen ? 'w-full max-w-[42rem]' : ''">
                        <slot />
                    </div>
                </div>

                <footer
                    v-if="$slots.footer"
                    class="border-t border-border-subtle px-3 py-2"
                >
                    <slot name="footer" />
                </footer>
            </div>
        </div>
    </Teleport>
</template>
