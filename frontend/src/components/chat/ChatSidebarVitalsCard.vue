<script setup lang="ts">
import {computed} from 'vue'

import ChatSidebarDataRow from '@/components/chat/ChatSidebarDataRow.vue'
import ChatSidebarSection from '@/components/chat/ChatSidebarSection.vue'
import type {PatientVitals} from '@/types'

const LABELS = {
    vitalsEyebrow: 'Витальные показатели',
    liveTag: 'Live',
    vitalHrLabel: 'ЧСС',
    vitalHrUnit: 'уд/мин',
    vitalBpLabel: 'АД',
    vitalBpUnit: 'mmHg',
    vitalSpo2Label: 'SpO₂',
    vitalSpo2Unit: '%',
    vitalTempLabel: 'Темп.',
    vitalTempUnit: '°C',
    vitalRrLabel: 'ЧДД',
    vitalRrUnit: '/мин',
    vitalsEmpty: 'До запроса физикального осмотра витальные показатели скрыты.',
    requestExamButton: 'Провести осмотр',
} as const

interface Props {
    vitals: PatientVitals | null
    examRevealed: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
    'request-exam': []
}>()

const isRevealed = computed(() => props.examRevealed && props.vitals !== null)

function handleRequestExam(): void {
    emit('request-exam')
}
</script>

<template>
    <ChatSidebarSection :label="LABELS.vitalsEyebrow">
        <template
            v-if="isRevealed"
            #aside
        >
            <span
                class="flex items-center gap-[0.4rem] text-[0.95rem] font-mono uppercase tracking-[0.06em] text-dark-teal"
            >
                <span class="size-2 rounded-full bg-dark-teal anim-pulse"/>
                {{ LABELS.liveTag }}
            </span>
        </template>

        <template v-if="isRevealed && vitals">
            <ChatSidebarDataRow
                :label="LABELS.vitalHrLabel"
                mono
            >
                {{ vitals.heartRate }} {{ LABELS.vitalHrUnit }}
            </ChatSidebarDataRow>
            <ChatSidebarDataRow
                :label="LABELS.vitalBpLabel"
                mono
            >
                {{ vitals.bloodPressure }} {{ LABELS.vitalBpUnit }}
            </ChatSidebarDataRow>
            <ChatSidebarDataRow
                :label="LABELS.vitalSpo2Label"
                mono
            >
                {{ vitals.spo2 }}&nbsp;{{ LABELS.vitalSpo2Unit }}
            </ChatSidebarDataRow>
            <ChatSidebarDataRow
                :label="LABELS.vitalTempLabel"
                mono
            >
                {{ vitals.temperatureC.toFixed(1) }} {{ LABELS.vitalTempUnit }}
            </ChatSidebarDataRow>
            <ChatSidebarDataRow
                :label="LABELS.vitalRrLabel"
                mono
            >
                {{ vitals.respiratoryRate }} {{ LABELS.vitalRrUnit }}
            </ChatSidebarDataRow>
        </template>

        <div
            v-else
            class="flex flex-col items-start gap-[0.8rem]"
        >
            <p class="text-[1.15rem] leading-normal text-dark-ink-3">
                {{ LABELS.vitalsEmpty }}
            </p>
            <button
                type="button"
                class="rounded-[0.6rem] border border-dark-line-strong bg-transparent px-4 py-2 text-[1.1rem] text-dark-teal transition hover:bg-[rgb(63_185_179/0.08)]"
                @click="handleRequestExam"
            >
                {{ LABELS.requestExamButton }}
            </button>
        </div>
    </ChatSidebarSection>
</template>