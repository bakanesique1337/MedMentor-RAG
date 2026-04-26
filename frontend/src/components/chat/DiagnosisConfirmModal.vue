<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import MmArrow from '@/components/common/MmArrow.vue'
import { VButton, VInput, VModal, VRange, VTextarea } from '@/components/ui'

const COPY = {
    eyebrowPrefix: 'Final diagnosis · Case #',
    titleLead: 'Подтвердите',
    titleAccent: 'диагноз',
    description: 'После подтверждения симуляция завершится, и модель сравнит ваш ответ с эталоном.',
    diagnosisLabel: 'Формулировка диагноза',
    diagnosisPlaceholder: 'Например: Острая респираторная вирусная инфекция',
    rationaleLabel: 'Обоснование',
    rationaleHint: 'что натолкнуло на гипотезу',
    rationalePlaceholder: 'Кратко опишите ход рассуждения...',
    confidenceLabel: 'Уверенность',
    immutabilityNote: 'После подтверждения изменения невозможны.',
    cancelButton: 'Отмена',
    submitButton: 'Подтвердить и завершить',
} as const

interface DiagnosisPayload {
    diagnosis: string
    rationale: string | null
    confidence: number | null
}

interface Props {
    modelValue: boolean
    sessionId: number
    isPending: boolean
    conflictMessage: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    diagnose: [payload: DiagnosisPayload]
}>()

const diagnosis = ref('')
const rationale = ref('')
const confidence = ref(70)

const isOpen = computed({
    get: () => props.modelValue,
    set: (value: boolean) => emit('update:modelValue', value),
})

const eyebrow = computed(() => `${COPY.eyebrowPrefix}${props.sessionId}`)

const isSubmitDisabled = computed(() => diagnosis.value.trim().length === 0 || props.isPending)

watch(
    () => props.modelValue,
    (open) => {
        if (!open) {
            diagnosis.value = ''
            rationale.value = ''
            confidence.value = 70
        }
    },
)

/**
 * Closes the modal without submitting.
 */
function handleCancel(): void {
    isOpen.value = false
}

/**
 * Emits the diagnose event with the submitted payload.
 */
function handleConfirm(): void {
    if (isSubmitDisabled.value) return
    const trimmedRationale = rationale.value.trim()
    emit('diagnose', {
        diagnosis: diagnosis.value.trim(),
        rationale: trimmedRationale.length === 0 ? null : trimmedRationale,
        confidence: confidence.value,
    })
}
</script>

<template>
    <VModal
        v-model="isOpen"
        accent="brand"
        max-width="56rem"
        :close-on-backdrop="!isPending"
        :close-on-escape="!isPending"
    >
        <template #header>
            <p class="pr-[3.6rem] text-eyebrow text-brand">
                {{ eyebrow }}
            </p>
            <h2 class="mt-[0.8rem] font-serif text-[2.6rem] font-medium leading-[1.15] tracking-[-0.02em] text-text-primary">
                {{ COPY.titleLead }} <em class="italic text-brand">{{ COPY.titleAccent }}</em>
            </h2>
            <p class="mt-[0.6rem] text-[1.3rem] text-text-secondary">
                {{ COPY.description }}
            </p>
            <div class="-mx-[3.2rem] mt-[1.6rem] h-[1px] bg-[color:var(--color-line)]" />
        </template>

        <div
            v-if="conflictMessage"
            class="mb-[1.4rem] rounded-[0.8rem] border border-[color:rgb(181_138_78_/_0.3)] bg-[color:var(--color-amber-soft)] px-[1.4rem] py-[1rem] text-[1.3rem] text-[color:var(--color-amber-text)]"
        >
            {{ conflictMessage }}
        </div>

        <div class="mb-[1.6rem]">
            <p class="mb-[0.8rem] whitespace-nowrap text-eyebrow text-brand">
                {{ COPY.diagnosisLabel }}
            </p>
            <VInput
                v-model="diagnosis"
                :placeholder="COPY.diagnosisPlaceholder"
                size="md"
                :disabled="isPending"
            />
        </div>

        <div class="mb-[1.6rem]">
            <div class="mb-[0.4rem]">
                <p class="whitespace-nowrap text-eyebrow text-brand">
                    {{ COPY.rationaleLabel }}
                </p>
                <p class="mt-[0.2rem] text-[1.15rem] text-text-tertiary">
                    {{ COPY.rationaleHint }}
                </p>
            </div>
            <VTextarea
                v-model="rationale"
                :rows="3"
                :placeholder="COPY.rationalePlaceholder"
                resize="vertical"
                :disabled="isPending"
            />
        </div>

        <div class="mb-[0.4rem]">
            <p class="mb-[0.8rem] whitespace-nowrap text-eyebrow text-brand">
                {{ COPY.confidenceLabel }}
            </p>
            <VRange
                v-model="confidence"
                :min="0"
                :max="100"
                value-suffix="%"
                :disabled="isPending"
            />
        </div>

        <template #footer>
            <div class="flex items-center gap-[1rem]">
                <p class="flex flex-1 items-center gap-[0.6rem] text-[1.15rem] text-[color:var(--color-teal-deep)]">
                    <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        class="shrink-0"
                    >
                        <circle
                            cx="6"
                            cy="6"
                            r="5"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1"
                        />
                        <path
                            d="M6 3v3M6 8v0.5"
                            stroke="currentColor"
                            stroke-width="1.1"
                            stroke-linecap="round"
                        />
                    </svg>
                    {{ COPY.immutabilityNote }}
                </p>
                <VButton
                    variant="secondary"
                    shape="rect"
                    size="sm"
                    :disabled="isPending"
                    @click="handleCancel"
                >
                    {{ COPY.cancelButton }}
                </VButton>
                <VButton
                    shape="rect"
                    size="sm"
                    :loading="isPending"
                    :disabled="isSubmitDisabled"
                    @click="handleConfirm"
                >
                    <template #leading>
                        <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                        ><path
                            d="M2 6l3 3 5-6"
                            stroke="currentColor"
                            stroke-width="1.6"
                            fill="none"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        /></svg>
                    </template>
                    {{ COPY.submitButton }}
                    <template #trailing>
                        <MmArrow :size="10" />
                    </template>
                </VButton>
            </div>
        </template>
    </VModal>
</template>
