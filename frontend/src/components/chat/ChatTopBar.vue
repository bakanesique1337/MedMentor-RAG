<script setup lang="ts">
import { computed } from 'vue'

import type { SimulationSession, SimulationState } from '@/types'

const COPY = {
    backAriaLabel: 'Назад к кейсам',
    turnLabel: 'Turn',
    finishButton: 'Завершить кейс',
    diagnoseButton: 'Подтвердить диагноз',
} as const

interface Props {
    session: SimulationSession
    sessionId: number
    canFinish: boolean
    canDiagnose: boolean
    isAbandonPending: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
    back: []
    finish: []
    diagnose: []
}>()

const STATE_LABEL: Record<SimulationState, string> = {
    CASE_BROWSE: 'Каталог',
    CASE_SELECTED: 'Кейс выбран',
    CASE_STARTED: 'Запуск',
    IN_PROGRESS: 'Симуляция активна',
    DIAGNOSIS_SELECT: 'Выбор диагноза',
    SCORING: 'Оценка',
    COMPLETED: 'Завершено',
    ABANDONED: 'Прервана',
}

const STATE_TONE: Record<SimulationState, 'brand' | 'amber' | 'mint'> = {
    CASE_BROWSE: 'brand',
    CASE_SELECTED: 'brand',
    CASE_STARTED: 'brand',
    IN_PROGRESS: 'brand',
    DIAGNOSIS_SELECT: 'amber',
    SCORING: 'amber',
    COMPLETED: 'mint',
    ABANDONED: 'amber',
}

const doctorTurns = computed(() =>
    props.session.messages.filter((m) => m.role === 'DOCTOR').length,
)

const tone = computed(() => STATE_TONE[props.session.state])

function handleBack(): void {
    emit('back')
}

function handleFinish(): void {
    emit('finish')
}

function handleDiagnose(): void {
    emit('diagnose')
}
</script>

<template>
    <header class="flex shrink-0 items-center gap-[1.2rem] border-b border-[color:var(--color-line-2)] bg-surface-base px-[2.4rem] py-[1.2rem]">
        <button
            type="button"
            class="flex size-[3.4rem] shrink-0 items-center justify-center rounded-[0.7rem] border border-[color:var(--color-line-2)] text-text-secondary transition hover:bg-white"
            :aria-label="COPY.backAriaLabel"
            @click="handleBack"
        >
            <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
            ><path
                d="M9 3L5 7l4 4"
                stroke="currentColor"
                stroke-width="1.4"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
            /></svg>
        </button>

        <span class="truncate font-mono text-[1.2rem] font-semibold tracking-[0.04em] text-brand">
            #{{ sessionId }}
        </span>

        <div class="flex-1" />

        <span
            class="hidden items-center gap-[0.6rem] rounded-full px-[1rem] py-[0.4rem] text-eyebrow-sm md:inline-flex"
            :class="{
                'bg-brand-ghost text-brand-deep': tone === 'brand',
                'bg-[color:var(--color-amber-soft)] text-[color:var(--color-amber-text)]': tone === 'amber',
                'bg-[color:var(--color-mint)]/40 text-[color:var(--color-ink)]': tone === 'mint',
            }"
        >
            <span
                class="h-[0.6rem] w-[0.6rem] rounded-full anim-pulse"
                :class="{
                    'bg-brand': tone === 'brand',
                    'bg-[color:var(--color-amber)]': tone === 'amber',
                    'bg-[color:var(--color-ink)]': tone === 'mint',
                }"
            />
            {{ STATE_LABEL[session.state] }}
        </span>

        <span class="hidden font-mono text-[1.15rem] tracking-[0.04em] text-text-tertiary lg:inline">
            {{ COPY.turnLabel }} {{ String(doctorTurns).padStart(2, '0') }}
        </span>

        <div class="flex shrink-0 gap-[0.8rem]">
            <button
                v-if="canFinish"
                type="button"
                class="inline-flex h-[3.4rem] items-center gap-[0.8rem] whitespace-nowrap rounded-[0.7rem] border border-[color:var(--color-rose-soft)] bg-transparent px-[1.4rem] text-[1.3rem] font-medium text-[color:var(--color-danger)] transition hover:bg-[color:var(--color-rose-soft)]/40 disabled:opacity-60"
                :disabled="isAbandonPending"
                @click="handleFinish"
            >
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                ><rect
                    x="2"
                    y="2"
                    width="8"
                    height="8"
                    rx="1"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.3"
                /></svg>
                {{ COPY.finishButton }}
            </button>

            <button
                v-if="canDiagnose"
                type="button"
                class="inline-flex h-[3.4rem] items-center gap-[0.8rem] whitespace-nowrap rounded-[0.7rem] bg-brand px-[1.6rem] text-[1.3rem] font-medium text-white shadow-primary transition hover:bg-brand-deep disabled:opacity-60"
                @click="handleDiagnose"
            >
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 14 14"
                ><path
                    d="M7 1v12M1 7h12"
                    stroke="currentColor"
                    stroke-width="1.4"
                    stroke-linecap="round"
                /></svg>
                {{ COPY.diagnoseButton }}
            </button>
        </div>
    </header>
</template>
