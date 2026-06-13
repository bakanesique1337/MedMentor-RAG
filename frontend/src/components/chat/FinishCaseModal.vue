<script setup lang="ts">
import {computed} from 'vue'

import VWarningTriangleIcon from '@/components/icons/VWarningTriangleIcon.vue'
import {VButton, VModal} from '@/components/ui'

const COPY = {
    eyebrowPrefix: 'Exit case · #',
    titleLead: 'Завершить',
    titleAccent: 'без диагноза',
    titleTail: '?',
    callout: 'Вы не получите баллов за диагностическую точность. К задаче можно вернуться позже.',
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
            <h2 class="mt-[0.8rem] font-serif text-[2.6rem] font-medium leading-[1.15] tracking-[-0.02em] text-text-primary">
                {{ COPY.titleLead }}
                <em class="italic text-(--color-amber)">{{ COPY.titleAccent }}</em>{{ COPY.titleTail }}
            </h2>
        </template>

        <div
            class="mb-[0.4rem] flex items-start gap-[1.2rem] rounded-[0.8rem] border border-[rgb(181_138_78/0.3)] bg-(--color-amber-soft) px-[1.6rem] py-[1.4rem]"
        >
            <span
                class="flex size-[3.2rem] shrink-0 items-center justify-center rounded-full bg-white text-(--color-amber)"
            >
                <VWarningTriangleIcon />
            </span>
            <p class="flex-1 text-[1.3rem] leading-[1.55] text-(--color-amber-text)">
                {{ COPY.callout }}
            </p>
        </div>

        <template #footer>
            <div class="flex gap-4">
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
