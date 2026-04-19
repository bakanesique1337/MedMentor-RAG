<script setup lang="ts">
import { onClickOutside, onKeyStroke, useScrollLock } from '@vueuse/core'
import { computed, nextTick, ref, watch } from 'vue'

import { cn } from '@/components/ui/utils'

type ModalAccent = 'none' | 'brand' | 'amber' | 'danger'

interface Props {
    modelValue?: boolean
    closeOnBackdrop?: boolean
    closeOnEscape?: boolean
    title?: string
    description?: string
    eyebrow?: string
    accent?: ModalAccent
    rootClass?: string
    fullscreen?: boolean
    maxWidth?: string
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    closeOnBackdrop: true,
    closeOnEscape: true,
    title: '',
    description: '',
    eyebrow: '',
    accent: 'none',
    rootClass: '',
    fullscreen: false,
    maxWidth: '56rem',
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
        if (!value) emit('close')
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
    if (!props.closeOnEscape || !isOpen.value) return
    event.preventDefault()
    isOpen.value = false
})

function focusFirstElement(): void {
    if (!panelRef.value) return
    const focusable = panelRef.value.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    const first = focusable[0]
    if (first) {
        first.focus()
        return
    }
    panelRef.value.focus()
}

const ACCENT_BAR: Record<ModalAccent, string> = {
    none: '',
    brand: 'bg-gradient-to-r from-brand to-brand-bright',
    amber: 'bg-gradient-to-r from-[color:var(--color-amber)] to-[#e8b54a]',
    danger: 'bg-gradient-to-r from-[color:var(--color-danger)] to-[color:var(--color-danger-bright)]',
}
</script>

<template>
    <Teleport to="body">
        <div
            v-if="isOpen"
            ref="containerRef"
            class="fixed inset-0 z-[100] flex items-center justify-center px-[2rem] anim-fade-in"
            style="background: rgba(10, 31, 31, 0.5); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);"
        >
            <div
                ref="panelRef"
                :class="cn(
                    'anim-pop-in relative flex w-full flex-col overflow-hidden rounded-[2rem] border border-[color:var(--color-line)] bg-white shadow-modal',
                    props.rootClass,
                )"
                :style="{ maxWidth: props.maxWidth, maxHeight: '90vh' }"
                role="dialog"
                aria-modal="true"
                :aria-label="title || undefined"
                tabindex="-1"
            >
                <div
                    v-if="accent !== 'none'"
                    class="h-[0.4rem] shrink-0"
                    :class="ACCENT_BAR[accent]"
                    aria-hidden="true"
                />

                <button
                    type="button"
                    class="absolute right-[1.6rem] top-[1.6rem] z-10 flex size-[3.2rem] items-center justify-center rounded-full border border-[color:var(--color-line-2)] text-text-secondary hover:bg-surface-base"
                    :class="accent !== 'none' ? 'top-[2rem]' : ''"
                    aria-label="Close"
                    @click="isOpen = false"
                >
                    <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                    ><path
                        d="M3 3l6 6M9 3l-6 6"
                        stroke="currentColor"
                        stroke-width="1.4"
                        stroke-linecap="round"
                    /></svg>
                </button>

                <div
                    v-if="eyebrow || title || description || $slots.header"
                    class="px-[3.2rem] pb-[1.8rem] pt-[3rem]"
                >
                    <slot name="header">
                        <p
                            v-if="eyebrow"
                            class="text-eyebrow text-brand"
                        >
                            {{ eyebrow }}
                        </p>
                        <h2
                            v-if="title"
                            class="mt-[0.8rem] font-serif text-[2.8rem] font-medium leading-[1.12] tracking-[-0.02em] text-text-primary"
                        >
                            <slot name="title">{{ title }}</slot>
                        </h2>
                        <p
                            v-if="description"
                            class="mt-[0.6rem] text-[1.35rem] text-text-secondary"
                        >
                            <slot name="description">{{ description }}</slot>
                        </p>
                    </slot>
                </div>

                <div class="flex-1 overflow-y-auto px-[3.2rem] pb-[2.8rem]">
                    <slot />
                </div>

                <footer
                    v-if="$slots.footer"
                    class="shrink-0 border-t border-[color:var(--color-line)] bg-[color:var(--color-teal-ghost)] px-[2.4rem] py-[1.6rem]"
                >
                    <slot name="footer" />
                </footer>
            </div>
        </div>
    </Teleport>
</template>
