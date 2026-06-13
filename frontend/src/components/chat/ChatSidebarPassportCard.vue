<script setup lang="ts">
import {computed} from 'vue'

import ChatSidebarDataRow from '@/components/chat/ChatSidebarDataRow.vue'
import ChatSidebarSection from '@/components/chat/ChatSidebarSection.vue'
import {usePluralize} from '@/composables/shared/usePluralize'
import type {PatientPassport} from '@/types'

const YEARS_FORMS = ['г.', 'г.', 'л.'] as const

const LABELS = {
    passportEyebrow: 'Паспорт пациента',
    cmUnit: 'см',
    kgUnit: 'кг',
    bmiLabel: 'ИМТ',
    passportEmpty: 'Запросите осмотр, чтобы увидеть антропометрию.',
} as const

const FALLBACK_PATIENT_INITIALS = 'ПС'
const SEX_FEMALE_VALUES = ['female', 'жен'] as const
const SEX_LABEL = {female: 'Ж', male: 'М'} as const

interface BmiInfo {
    value: string
    label: string
    alert: boolean
}

interface BmiBand {
    upTo: number
    label: string
    alert: boolean
}

const BMI_BANDS: BmiBand[] = [
    {upTo: 18.5, label: 'дефицит массы', alert: true},
    {upTo: 25, label: 'норма', alert: false},
    {upTo: 30, label: 'избыток', alert: true},
    {upTo: 35, label: 'ожирение I', alert: true},
    {upTo: 40, label: 'ожирение II', alert: true},
    {upTo: Infinity, label: 'ожирение III', alert: true},
]

interface Props {
    patientName: string
    patientAge: number
    patientSex: string
    passport: PatientPassport | null
    examRevealed: boolean
}

const props = defineProps<Props>()

const yearsSuffix = usePluralize(() => props.patientAge, YEARS_FORMS)

const patientInitials = computed(() => {
    const initials = props.patientName
        .split(' ')
        .slice(0, 2)
        .map((p) => p[0] || '')
        .join('')
        .toUpperCase()
    return initials || FALLBACK_PATIENT_INITIALS
})

const sexLabel = computed(() => {
    const sex = props.patientSex?.toLowerCase() || ''
    const isFemale = SEX_FEMALE_VALUES.includes(sex as typeof SEX_FEMALE_VALUES[number])
    return isFemale ? SEX_LABEL.female : SEX_LABEL.male
})

const bmi = computed<BmiInfo | null>(() => {
    const p = props.passport
    if (!p) return null
    const heightM = p.heightCm / 100
    if (heightM <= 0) return null
    const value = p.weightKg / (heightM * heightM)
    const band = BMI_BANDS.find((b) => value < b.upTo)
    if (!band) return null
    return {value: value.toFixed(1), label: band.label, alert: band.alert}
})

const isRevealed = computed(() => props.examRevealed && props.passport !== null)
</script>

<template>
    <ChatSidebarSection :label="LABELS.passportEyebrow">
        <div class="flex items-center gap-4 border-b border-dark-line pb-[0.8rem]">
            <div
                class="flex size-[3.6rem] shrink-0 items-center justify-center rounded-full font-serif text-[1.3rem] font-semibold text-(--color-ink)"
                style="background: linear-gradient(135deg, var(--color-dark-teal), var(--color-teal-deep));"
            >
                {{ patientInitials }}
            </div>
            <div class="min-w-0 flex-1">
                <p class="text-[1.3rem] font-medium text-dark-ink">
                    {{ patientName }}
                </p>
                <p class="text-[1.1rem] text-dark-ink-2">
                    {{ patientAge }}&nbsp;{{ yearsSuffix }} &middot; {{ sexLabel }}
                    <template v-if="isRevealed && passport">
                        &middot; {{ passport.heightCm }}&nbsp;{{ LABELS.cmUnit }} &middot;
                        {{ passport.weightKg }}&nbsp;{{ LABELS.kgUnit }}
                    </template>
                </p>
            </div>
        </div>

        <template v-if="isRevealed && passport">
            <ChatSidebarDataRow
                v-if="bmi"
                :label="LABELS.bmiLabel"
                :alert="bmi.alert"
            >
                {{ bmi.value }} ({{ bmi.label }})
            </ChatSidebarDataRow>
        </template>

        <p
            v-else
            class="pt-[0.8rem] text-[1.15rem] leading-normal text-dark-ink-3"
        >
            {{ LABELS.passportEmpty }}
        </p>
    </ChatSidebarSection>
</template>
