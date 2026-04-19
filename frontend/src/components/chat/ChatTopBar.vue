<script setup lang="ts">
import { computed } from 'vue'

import type { SimulationSession, SimulationState } from '@/types'

interface Props {
    session: SimulationSession
    sessionId: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
    back: []
}>()

const STATE_LABEL: Record<SimulationState, string> = {
    CASE_BROWSE: 'Каталог',
    CASE_SELECTED: 'Кейс выбран',
    CASE_STARTED: 'Запуск',
    IN_PROGRESS: 'Симуляция активна',
    DIAGNOSIS_SELECT: 'Выбор диагноза',
    SCORING: 'Оценка',
    COMPLETED: 'Завершено',
}

const STATE_TONE: Record<SimulationState, 'brand' | 'amber' | 'mint'> = {
    CASE_BROWSE: 'brand',
    CASE_SELECTED: 'brand',
    CASE_STARTED: 'brand',
    IN_PROGRESS: 'brand',
    DIAGNOSIS_SELECT: 'amber',
    SCORING: 'amber',
    COMPLETED: 'mint',
}

const doctorTurns = computed(() =>
    props.session.messages.filter((m) => m.role === 'DOCTOR').length,
)

const tone = computed(() => STATE_TONE[props.session.state])

function handleBack(): void {
    emit('back')
}
</script>

<template>
    <header class="flex shrink-0 items-center gap-[1.2rem] border-b border-[color:var(--color-line-2)] bg-surface-base px-[2.4rem] py-[1.2rem]">
        <button
            type="button"
            class="flex size-[3.4rem] shrink-0 items-center justify-center rounded-[0.7rem] border border-[color:var(--color-line-2)] text-text-secondary transition hover:bg-white"
            aria-label="Назад к кейсам"
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

        <nav
            class="flex min-w-0 items-center gap-[0.6rem] overflow-hidden whitespace-nowrap text-[1.2rem] text-text-secondary"
            aria-label="Breadcrumbs"
        >
            <span class="hidden sm:inline">Кейсы</span>
            <svg
                class="hidden shrink-0 opacity-50 sm:inline"
                width="8"
                height="8"
                viewBox="0 0 8 8"
            ><path
                d="M3 2l3 2-3 2"
                stroke="currentColor"
                stroke-width="1.2"
                fill="none"
            /></svg>
            <span class="truncate font-mono text-[1.15rem] font-semibold tracking-[0.04em] text-brand">
                #{{ sessionId }}
            </span>
        </nav>

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
            Turn {{ String(doctorTurns).padStart(2, '0') }}
        </span>
    </header>
</template>
