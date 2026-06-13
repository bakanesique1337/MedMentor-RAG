<script setup lang="ts">
import {computed} from 'vue'

import type {PatientPassport, PatientVitals} from '@/types'

const COPY = {
    header: 'Данные осмотра · Система',
} as const

interface Props {
    passport: PatientPassport | null
    vitals: PatientVitals | null
}

const props = defineProps<Props>()

interface VitalRow {
    label: string
    value: string
    alert: boolean
}

const VITAL_RANGES = {
    hr: {low: 60, high: 100},
    spo2: {low: 95, high: 100},
    temp: {low: 36.0, high: 37.2},
    rr: {low: 12, high: 20},
} as const

function outOfRange(kind: keyof typeof VITAL_RANGES, value: number): boolean {
    const {low, high} = VITAL_RANGES[kind]
    return value < low || value > high
}

function bpOutOfRange(systolic: number, diastolic: number): boolean {
    return systolic >= 140 || systolic < 90 || diastolic >= 90 || diastolic < 60
}

const vitalRows = computed<VitalRow[]>(() => {
    const v = props.vitals
    if (!v) return []
    const [sysRaw, diaRaw] = v.bloodPressure.split('/')
    const sys = parseInt(sysRaw ?? '0', 10)
    const dia = parseInt(diaRaw ?? '0', 10)
    return [
        {label: 'ЧСС', value: `${v.heartRate} уд/мин`, alert: outOfRange('hr', v.heartRate)},
        {label: 'АД', value: `${v.bloodPressure} мм.рт.ст.`, alert: bpOutOfRange(sys, dia)},
        {label: 'ЧДД', value: `${v.respiratoryRate} /мин`, alert: outOfRange('rr', v.respiratoryRate)},
        {label: 'SpO₂', value: `${v.spo2} %`, alert: outOfRange('spo2', v.spo2)},
        {label: 'Темп.', value: `${v.temperatureC.toFixed(1)} °C`, alert: outOfRange('temp', v.temperatureC)},
    ]
})

const bmi = computed(() => {
    const p = props.passport
    if (!p) return null
    const heightM = p.heightCm / 100
    if (heightM <= 0) return null
    const value = p.weightKg / (heightM * heightM)
    let label: string
    let alert = false
    if (value < 18.5) {
        label = 'дефицит массы';
        alert = true
    } else if (value < 25) {
        label = 'норма'
    } else if (value < 30) {
        label = 'избыток';
        alert = true
    } else if (value < 35) {
        label = 'ожирение I';
        alert = true
    } else if (value < 40) {
        label = 'ожирение II';
        alert = true
    } else {
        label = 'ожирение III';
        alert = true
    }
    return {value: value.toFixed(1), label, alert}
})

const passportRows = computed(() => {
    const p = props.passport
    if (!p) return []
    return [
        {label: 'Рост', value: `${p.heightCm} см`, alert: false},
        {label: 'Вес', value: `${p.weightKg} кг`, alert: false},
        ...(bmi.value ? [{
            label: 'ИМТ',
            value: `${bmi.value.value} (${bmi.value.label})`,
            alert: bmi.value.alert
        }] : []),
    ]
})
</script>

<template>
    <div
        v-if="vitals !== null || passport !== null"
        class="my-[1.2rem] flex w-full justify-start"
    >
        <div
            class="exam-findings-card ml-[4.4rem] flex w-full max-w-272 flex-col gap-4 rounded-[1rem] border border-[rgb(13_115_119/0.2)] p-[1.6rem]"
        >
            <div class="flex items-baseline justify-between gap-4">
                <p class="text-eyebrow font-mono text-brand-deep">
                    {{ COPY.header }}
                </p>
            </div>

            <div
                v-if="vitals"
                class="grid grid-cols-2 gap-x-[1.6rem] gap-y-[0.4rem] sm:grid-cols-3 lg:grid-cols-5"
            >
                <div
                    v-for="row in vitalRows"
                    :key="row.label"
                    class="flex flex-col gap-[0.2rem] rounded-sm border border-(--color-line) bg-white px-4 py-[0.7rem]"
                >
                    <p class="text-eyebrow-sm font-mono text-text-tertiary">{{ row.label }}</p>
                    <p
                        class="font-mono text-[1.35rem] font-medium tabular"
                        :class="row.alert ? 'text-(--color-amber-text)' : 'text-text-primary'"
                    >
                        {{ row.value }}
                    </p>
                </div>
            </div>

            <div
                v-if="passport"
                class="grid grid-cols-1 gap-x-[1.6rem] gap-y-[0.3rem] border-t border-(--color-line) pt-4 sm:grid-cols-2 lg:grid-cols-3"
            >
                <div
                    v-for="row in passportRows"
                    :key="row.label"
                    class="flex items-baseline justify-between gap-[0.8rem] text-[1.2rem]"
                >
                    <span class="text-text-secondary">{{ row.label }}</span>
                    <span
                        class="text-right font-medium"
                        :class="row.alert ? 'text-(--color-amber-text)' : 'text-text-primary'"
                    >
                        {{ row.value }}
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.exam-findings-card {
    background: var(--color-mint, #d5e9e8);
    background: linear-gradient(180deg, rgb(213 233 232 / 55%) 0%, rgb(213 233 232 / 25%) 100%);
}
</style>
