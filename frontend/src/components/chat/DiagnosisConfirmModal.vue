<script setup lang="ts">
import {computed, ref, watch} from 'vue'

import MmArrow from '@/components/common/MmArrow.vue'
import {VButton, VInput, VModal, VRange, VTextarea} from '@/components/ui'

const COPY = {
    eyebrowPrefix: 'Задача #',
    titleLead: 'Подтвердите',
    titleAccent: 'диагноз',
    diagnosisLabel: 'Формулировка диагноза',
    diagnosisPlaceholder: 'Острая респираторная вирусная инфекция',
    rationaleLabel: 'Обоснование',
    rationaleHint: 'что натолкнуло на гипотезу',
    rationalePlaceholder: 'Кратко опишите ход рассуждения...',
    confidenceLabel: 'Уверенность',
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
            <div class="-mx-[3.2rem] mt-[1.6rem] h-px bg-(--color-line)"/>
        </template>

        <div
            v-if="conflictMessage"
            class="mb-[1.4rem] rounded-[0.8rem] border border-[rgb(181_138_78/0.3)] bg-(--color-amber-soft) px-[1.4rem] py-4 text-[1.3rem] text-(--color-amber-text)"
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
            <div class="flex items-center gap-4">
                <VButton
                    shape="rect"
                    size="sm"
                    :loading="isPending"
                    :disabled="isSubmitDisabled"
                    @click="handleConfirm"
                >
                    {{ COPY.submitButton }}
                    <template #trailing>
                        <MmArrow :size="10"/>
                    </template>
                </VButton>
            </div>
        </template>
    </VModal>
</template>
