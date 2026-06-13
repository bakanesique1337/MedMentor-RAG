<script setup lang="ts">
import {onClickOutside, onKeyStroke, useScrollLock} from '@vueuse/core'
import {computed, ref, watch} from 'vue'

import VWarningTriangleIcon from '@/components/icons/VWarningTriangleIcon.vue'

interface Props {
    modelValue: boolean
    eyebrow?: string
    title: string
    titleAccent?: string
    description?: string
    callout?: string
    confirmLabel?: string
    cancelLabel?: string
    isPending?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    eyebrow: '',
    titleAccent: '',
    description: '',
    callout: '',
    confirmLabel: 'Подтвердить',
    cancelLabel: 'Отмена',
    isPending: false,
})

const emit = defineEmits<{
    (event: 'update:modelValue', value: boolean): void
    (event: 'confirm'): void
    (event: 'cancel'): void
}>()

const containerRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)

const isOpen = computed({
    get: () => props.modelValue,
    set: (value: boolean) => emit('update:modelValue', value),
})

const scrollLocked = useScrollLock(containerRef)

watch(isOpen, (value) => {
    scrollLocked.value = value
})

onClickOutside(panelRef, () => {
    if (!isOpen.value || props.isPending) return
    handleCancel()
})

onKeyStroke('Escape', (event) => {
    if (!isOpen.value || props.isPending) return
    event.preventDefault()
    handleCancel()
})

function handleCancel(): void {
    emit('cancel')
    isOpen.value = false
}

function handleConfirm(): void {
    emit('confirm')
}

const CLOSE_ARIA_LABEL = 'Закрыть'
</script>

<template>
    <Teleport to="body">
        <div
            v-if="isOpen"
            ref="containerRef"
            class="anim-fade-in fixed inset-0 z-100 flex items-center justify-center px-8"
            style="background: rgb(10 31 31 / 55%); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);"
        >
            <div
                ref="panelRef"
                class="anim-pop-in relative flex w-full flex-col overflow-hidden rounded-lg border border-(--color-line-2) bg-surface-base shadow-modal"
                style="max-width: 46rem;"
                role="dialog"
                aria-modal="true"
                :aria-label="title"
                tabindex="-1"
            >
                <div
                    class="h-[0.4rem] shrink-0"
                    style="background: linear-gradient(90deg, var(--color-amber), #e8b54a);"
                    aria-hidden="true"
                />

                <button
                    type="button"
                    class="absolute right-[1.6rem] top-8 flex size-12 items-center justify-center rounded-[0.6rem] text-text-secondary hover:bg-surface-raised disabled:opacity-50"
                    :aria-label="CLOSE_ARIA_LABEL"
                    :disabled="isPending"
                    @click="handleCancel"
                >
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                    >
                        <path
                            d="M2 2l10 10M12 2L2 12"
                            stroke="currentColor"
                            stroke-width="1.4"
                            stroke-linecap="round"
                        />
                    </svg>
                </button>

                <div class="border-b border-(--color-line) px-[2.4rem] pb-[1.6rem] pt-8">
                    <p
                        v-if="eyebrow"
                        class="text-eyebrow font-mono"
                        style=" letter-spacing: 0.12em;color: var(--color-amber);"
                    >
                        {{ eyebrow }}
                    </p>
                    <h2 class="mt-[0.6rem] font-serif text-[2.6rem] font-medium leading-[1.15] tracking-[-0.01em] text-text-primary">
                        {{ title }}
                        <template v-if="titleAccent">
                            <span style=" font-style: italic;color: var(--color-amber);"> {{ titleAccent }}</span>
                        </template>
                    </h2>
                    <p
                        v-if="description"
                        class="mt-[0.4rem] text-[1.3rem] leading-[1.55] text-text-secondary"
                    >
                        {{ description }}
                    </p>
                </div>

                <div class="px-[2.4rem] pb-8 pt-[1.8rem]">
                    <div
                        v-if="callout"
                        class="mb-[1.6rem] flex items-start gap-[1.2rem] rounded-[0.8rem] border px-[1.4rem] py-[1.2rem]"
                        style=" border-color: rgb(216 154 42 / 30%);background: var(--color-amber-soft);"
                    >
                        <div
                            class="flex size-[3.2rem] shrink-0 items-center justify-center rounded-full bg-white"
                            style="color: var(--color-amber);"
                        >
                            <VWarningTriangleIcon />
                        </div>
                        <div
                            class="flex-1 text-[1.3rem] leading-[1.55]"
                            style="color: #6b4d0f;"
                        >
                            {{ callout }}
                        </div>
                    </div>

                    <div class="flex gap-4">
                        <button
                            type="button"
                            class="h-[3.8rem] flex-1 rounded-sm border border-(--color-line-2) bg-transparent px-[1.4rem] text-[1.3rem] font-medium text-text-primary transition hover:bg-surface-raised disabled:opacity-50"
                            :disabled="isPending"
                            @click="handleCancel"
                        >
                            {{ cancelLabel }}
                        </button>
                        <button
                            type="button"
                            class="h-[3.8rem] flex-1 rounded-sm border-none px-[1.4rem] text-[1.3rem] font-medium text-white transition disabled:opacity-50"
                            style="background: var(--color-amber); box-shadow: 0 4px 12px rgb(216 154 42 / 28%);"
                            :disabled="isPending"
                            @click="handleConfirm"
                        >
                            {{ confirmLabel }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>
