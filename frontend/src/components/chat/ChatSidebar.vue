<script setup lang="ts">
import {computed, ref} from 'vue'

import ChatSidebarCaseSummary from '@/components/chat/ChatSidebarCaseSummary.vue'
import ChatSidebarPassportCard from '@/components/chat/ChatSidebarPassportCard.vue'
import ChatSidebarVitalsCard from '@/components/chat/ChatSidebarVitalsCard.vue'
import WarningModal from '@/components/common/WarningModal.vue'
import VCasesIcon from '@/components/icons/VCasesIcon.vue'
import SidebarBrandHeader from '@/components/layout/sidebar/SidebarBrandHeader.vue'
import SidebarNavButton from '@/components/layout/sidebar/SidebarNavButton.vue'
import SidebarProfileFooter from '@/components/layout/sidebar/SidebarProfileFooter.vue'
import {MESSAGE_ROLE, SIMULATION_STATE, type SimulationSession, type SimulationState} from '@/types'

const LABELS = {
    casesNav: 'Задачи',
    warningTitle: 'Завершить',
    warningTitleAccent: 'без диагноза?',
    warningDescription: 'Прогресс будет сохранён, но задача будет отмечена как незавершённая.',
    warningCallout: 'Вы не получите баллов за диагностическую точность. К задаче можно вернуться позже — разбор будет доступен в режиме только для чтения.',
    warningCancel: 'Продолжить задачу',
    warningConfirm: 'Завершить задачу',
} as const

const NON_ABANDONABLE_STATES = new Set<SimulationState>([
    SIMULATION_STATE.SCORING,
    SIMULATION_STATE.COMPLETED,
    SIMULATION_STATE.ABANDONED,
])

interface Props {
    session: SimulationSession
    sessionId: number
    casesCount: number | null
    isAbandonPending: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
    abandon: []
    'request-exam': []
}>()

const isWarningOpen = ref(false)

const doctorTurns = computed(() =>
    props.session.messages.filter((m) => m.role === MESSAGE_ROLE.DOCTOR).length,
)

const isCanAbandon = computed(() => !NON_ABANDONABLE_STATES.has(props.session.state))

function handleNavigateCases(): void {
    if (!isCanAbandon.value) {
        emit('abandon')
        return
    }
    isWarningOpen.value = true
}

function handleConfirmAbandon(): void {
    emit('abandon')
}

function handleCancelAbandon(): void {
    isWarningOpen.value = false
}

function handleRequestExam(): void {
    emit('request-exam')
}
</script>

<template>
    <aside
        class="flex w-lg shrink-0 flex-col overflow-hidden border-r border-dark-line-strong bg-dark-bg text-dark-ink"
    >
        <SidebarBrandHeader/>

        <div class="px-4 py-[1.2rem]">
            <SidebarNavButton
                :label="LABELS.casesNav"
                :badge="props.casesCount"
                @click="handleNavigateCases"
            >
                <template #icon>
                    <VCasesIcon/>
                </template>
            </SidebarNavButton>
        </div>

        <div class="mx-[1.6rem] h-px bg-dark-line"/>

        <div class="flex-1 overflow-y-auto px-[1.6rem] py-[1.6rem]">
            <ChatSidebarCaseSummary
                :case-category="session.caseCategory"
                :case-title="session.caseTitle"
                :case-difficulty="session.caseDifficulty"
                :patient-name="session.patientName"
                :patient-age="session.patientAge"
                :doctor-turns="doctorTurns"
            />

            <ChatSidebarPassportCard
                :patient-name="session.patientName"
                :patient-age="session.patientAge"
                :patient-sex="session.patientSex"
                :passport="session.passport"
                :exam-revealed="session.examRevealed"
            />

            <ChatSidebarVitalsCard
                :vitals="session.vitals"
                :exam-revealed="session.examRevealed"
                @request-exam="handleRequestExam"
            />
        </div>

        <SidebarProfileFooter/>

        <WarningModal
            v-model="isWarningOpen"
            :title="LABELS.warningTitle"
            :title-accent="LABELS.warningTitleAccent"
            :description="LABELS.warningDescription"
            :callout="LABELS.warningCallout"
            :cancel-label="LABELS.warningCancel"
            :confirm-label="LABELS.warningConfirm"
            :is-pending="props.isAbandonPending"
            @confirm="handleConfirmAbandon"
            @cancel="handleCancelAbandon"
        />
    </aside>
</template>
