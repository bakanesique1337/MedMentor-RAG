<script setup lang="ts">
import { computed } from 'vue'

import { VButton, VModal } from '@/components/ui'

const COPY = {
    eyebrowPrefix: 'Exit case · #',
    titleLead: 'Завершить',
    titleAccent: 'без диагноза',
    titleTail: '?',
    description: 'Прогресс будет сохранён, но кейс будет отмечен как incomplete.',
    callout: 'Вы не получите баллов за диагностическую точность. К кейсу можно вернуться позже — разбор будет доступен в режиме только для чтения.',
    cancelButton: 'Продолжить кейс',
    confirmButton: 'Всё равно завершить',
} as const

interface Props {
    modelValue: boolean
    sessionId: number
    isPending: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    confirm: []
}>()

const isOpen = computed({
    get: () => props.modelValue,
    set: (value: boolean) => emit('update:modelValue', value),
})

/**
 * Closes the modal without finishing the case.
 */
function handleCancel(): void {
    isOpen.value = false
}

/**
 * Emits confirmation; the parent calls the abandon API.
 */
function handleConfirm(): void {
    if (props.isPending) return
    emit('confirm')
}
</script>

<template>
    <VModal
        v-model="isOpen"
        accent="amber"
        max-width="46rem"
        :close-on-backdrop="!isPending"
        :close-on-escape="!isPending"
    >
        <template #header>
            <p class="text-eyebrow text-[color:var(--color-amber)]">
                {{ COPY.eyebrowPrefix }}{{ sessionId }}
            </p>
            <h2 class="mt-[0.8rem] font-serif text-[2.6rem] font-medium leading-[1.15] tracking-[-0.02em] text-text-primary">
                {{ COPY.titleLead }}
                <em class="italic text-[color:var(--color-amber)]">{{ COPY.titleAccent }}</em>{{ COPY.titleTail }}
            </h2>
            <p class="mt-[0.6rem] text-[1.3rem] text-text-secondary">
                {{ COPY.description }}
            </p>
        </template>

        <div class="mb-[0.4rem] flex items-start gap-[1.2rem] rounded-[0.8rem] border border-[color:rgb(181_138_78_/_0.3)] bg-[color:var(--color-amber-soft)] px-[1.6rem] py-[1.4rem]">
            <span class="flex size-[3.2rem] shrink-0 items-center justify-center rounded-full bg-white text-[color:var(--color-amber)]">
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 22 22"
                >
                    <path
                        d="M11 3L2 19h18L11 3z"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.6"
                        stroke-linejoin="round"
                    />
                    <path
                        d="M11 10v4"
                        stroke="currentColor"
                        stroke-width="1.6"
                        stroke-linecap="round"
                    />
                    <circle
                        cx="11"
                        cy="16.5"
                        r="0.9"
                        fill="currentColor"
                    />
                </svg>
            </span>
            <p class="flex-1 text-[1.3rem] leading-[1.55] text-[color:var(--color-amber-text)]">
                {{ COPY.callout }}
            </p>
        </div>

        <template #footer>
            <div class="flex gap-[1rem]">
                <VButton
                    variant="secondary"
                    shape="rect"
                    block
                    :disabled="isPending"
                    @click="handleCancel"
                >
                    {{ COPY.cancelButton }}
                </VButton>
                <VButton
                    variant="danger"
                    shape="rect"
                    block
                    :loading="isPending"
                    @click="handleConfirm"
                >
                    {{ COPY.confirmButton }}
                </VButton>
            </div>
        </template>
    </VModal>
</template>
