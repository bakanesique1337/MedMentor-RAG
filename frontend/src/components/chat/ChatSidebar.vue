<script setup lang="ts">
import { computed } from 'vue'

import type { SimulationSession, SimulationState } from '@/types'

interface Props {
    session: SimulationSession
    sessionId: number
}

const props = defineProps<Props>()

interface ChecklistItem {
    label: string
    state: 'done' | 'active' | 'pending'
}

const checklist = computed<ChecklistItem[]>(() => {
    const msgCount = props.session.messages.filter((m) => m.role === 'DOCTOR').length
    const state = props.session.state

    const pastInProgress = state === 'DIAGNOSIS_SELECT' || state === 'SCORING' || state === 'COMPLETED'
    const atDiagnosis = state === 'DIAGNOSIS_SELECT'

    const items: ChecklistItem[] = [
        {
            label: 'Представиться',
            state: msgCount >= 1 ? 'done' : 'active',
        },
        {
            label: 'Собрать жалобы',
            state: msgCount >= 2 ? 'done' : msgCount >= 1 ? 'active' : 'pending',
        },
        {
            label: 'Уточнить анамнез',
            state: msgCount >= 4 ? 'done' : msgCount >= 2 ? 'active' : 'pending',
        },
        {
            label: 'Провести осмотр',
            state: msgCount >= 6 ? 'done' : msgCount >= 4 ? 'active' : 'pending',
        },
        {
            label: 'Поставить диагноз',
            state: state === 'COMPLETED' ? 'done' : atDiagnosis ? 'active' : pastInProgress ? 'active' : 'pending',
        },
    ]

    return items
})

const progressLabel = computed(() => {
    const doctor = props.session.messages.filter((m) => m.role === 'DOCTOR').length
    return `${doctor}`
})

const STATE_LABEL: Record<SimulationState, string> = {
    CASE_BROWSE: 'Каталог',
    CASE_SELECTED: 'Выбран',
    CASE_STARTED: 'Старт',
    IN_PROGRESS: 'Активна',
    DIAGNOSIS_SELECT: 'Диагноз',
    SCORING: 'Оценка',
    COMPLETED: 'Завершён',
}

const patientInitials = computed(() => {
    const name = props.session.patientName
    return name
        .split(' ')
        .slice(0, 2)
        .map((p) => p[0] ?? '')
        .join('')
        .toUpperCase() || 'ПС'
})
</script>

<template>
    <aside
        class="flex w-[32rem] shrink-0 flex-col overflow-hidden border-r border-[color:var(--color-dark-line-strong)] bg-[color:var(--color-dark-bg)] text-[color:var(--color-dark-ink)]"
    >
        <div class="border-b border-[color:var(--color-dark-line)] px-[1.6rem] py-[1.6rem]">
            <p class="text-eyebrow text-[color:var(--color-dark-teal)]">Текущий кейс</p>
            <p class="mt-[0.8rem] text-eyebrow-sm text-[color:var(--color-dark-teal)]">
                {{ STATE_LABEL[session.state] }}
            </p>
            <h2 class="mt-[0.6rem] font-serif text-[2rem] font-medium leading-[1.2] tracking-[-0.01em] text-[color:var(--color-dark-ink)]">
                {{ session.caseTitle }}
            </h2>
            <p class="mt-[0.6rem] text-[1.15rem] text-[color:var(--color-dark-ink-2)]">
                ID симуляции &middot; <span class="font-mono">#{{ sessionId }}</span>
            </p>
        </div>

        <div class="flex-1 overflow-y-auto px-[1.6rem] py-[1.6rem]">
            <p class="mb-[0.8rem] text-eyebrow-sm text-[color:var(--color-dark-ink-3)]">Паспорт пациента</p>
            <div class="mb-[1.8rem] rounded-[0.8rem] border border-[color:var(--color-dark-line)] bg-[color:var(--color-dark-raised)] p-[1.2rem]">
                <div class="flex items-center gap-[1rem] border-b border-[color:var(--color-dark-line)] pb-[0.8rem]">
                    <div
                        class="flex size-[3.6rem] shrink-0 items-center justify-center rounded-full text-[1.3rem] font-semibold text-[color:var(--color-ink)]"
                        style="background: linear-gradient(135deg, var(--color-dark-teal), var(--color-teal-deep)); font-family: var(--font-serif);"
                    >
                        {{ patientInitials }}
                    </div>
                    <div class="min-w-0 flex-1">
                        <p class="text-[1.3rem] font-medium text-[color:var(--color-dark-ink)]">
                            {{ session.patientName }}
                        </p>
                        <p class="text-[1.1rem] text-[color:var(--color-dark-ink-2)]">
                            Виртуальный пациент
                        </p>
                    </div>
                </div>
            </div>

            <div class="mb-[1.6rem] grid grid-cols-2 gap-[0.8rem]">
                <div class="rounded-[0.8rem] border border-[color:var(--color-dark-line)] bg-[color:var(--color-dark-raised)] px-[1rem] py-[0.8rem]">
                    <p class="text-eyebrow-sm text-[color:var(--color-dark-ink-2)]">Вопросы</p>
                    <p class="mt-[0.3rem] font-mono text-[1.4rem] font-medium text-[color:var(--color-dark-teal)] tabular">
                        {{ progressLabel }}
                    </p>
                </div>
                <div class="rounded-[0.8rem] border border-[color:var(--color-dark-line)] bg-[color:var(--color-dark-raised)] px-[1rem] py-[0.8rem]">
                    <p class="text-eyebrow-sm text-[color:var(--color-dark-ink-2)]">Ходы</p>
                    <p class="mt-[0.3rem] font-mono text-[1.4rem] font-medium text-[color:var(--color-dark-ink)] tabular">
                        {{ session.messages.length }}
                    </p>
                </div>
            </div>

            <p class="mb-[0.8rem] text-eyebrow-sm text-[color:var(--color-dark-ink-3)]">Чек-лист</p>
            <div class="flex flex-col gap-[0.3rem]">
                <div
                    v-for="item in checklist"
                    :key="item.label"
                    class="flex items-center gap-[0.9rem] py-[0.6rem] text-[1.25rem]"
                    :class="{
                        'text-[color:var(--color-dark-teal)] line-through decoration-[color:rgb(63_185_179_/_0.4)]': item.state === 'done',
                        'text-[color:var(--color-dark-ink)] font-medium': item.state === 'active',
                        'text-[color:var(--color-dark-ink-3)]': item.state === 'pending',
                    }"
                >
                    <svg
                        v-if="item.state === 'done'"
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                    >
                        <circle
                            cx="6"
                            cy="6"
                            r="5.5"
                            fill="var(--color-dark-teal)"
                        />
                        <path
                            d="M3.5 6l2 2 3-4"
                            stroke="var(--color-dark-bg)"
                            stroke-width="1.4"
                            fill="none"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                    </svg>
                    <svg
                        v-else-if="item.state === 'active'"
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                    >
                        <circle
                            cx="6"
                            cy="6"
                            r="5.5"
                            fill="none"
                            stroke="var(--color-amber)"
                            stroke-width="1.2"
                        />
                        <circle
                            cx="6"
                            cy="6"
                            r="2.4"
                            fill="var(--color-amber)"
                        />
                    </svg>
                    <svg
                        v-else
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                    >
                        <circle
                            cx="6"
                            cy="6"
                            r="5.5"
                            fill="none"
                            stroke="var(--color-dark-ink-3)"
                            stroke-width="1"
                            stroke-dasharray="2 2"
                        />
                    </svg>
                    <span>{{ item.label }}</span>
                </div>
            </div>
        </div>
    </aside>
</template>
