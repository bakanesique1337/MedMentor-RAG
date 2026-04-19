<script setup lang="ts">
import { computed } from 'vue'

import VSkeleton from '@/components/ui/VSkeleton.vue'
import type { HistorySession, MessageRole, Score, SimulationSession } from '@/types'

interface Props {
    session: HistorySession
    isExpanded: boolean
    detail: SimulationSession | null
    isDetailLoading: boolean
}

const emit = defineEmits<{
    toggle: [id: number]
}>()

const props = defineProps<Props>()

type ScoreKey = Exclude<keyof Score, 'createdAt'>

const SCORE_LABELS: Array<[ScoreKey, string]> = [
    ['politeness', 'Вежливость'],
    ['questioningStructure', 'Опрос'],
    ['thoroughness', 'Полнота'],
    ['empathy', 'Эмпатия'],
    ['diagnosisCorrect', 'Диагноз'],
]

const ROLE_LABEL: Record<MessageRole, string> = {
    DOCTOR: 'Студент',
    PATIENT: 'Пациент',
    SYSTEM: 'Система',
}

const isCompleted = computed(() => props.session.state === 'COMPLETED')

/**
 * Returns a short locale date string for display.
 */
function formatDate(dateString: string): string {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

/**
 * Formats a 0-1 score as a percentage string.
 */
function formatScore(value: number | null): string {
    if (value === null) return '—'
    return `${Math.round(value * 100)}`
}

function handleToggle(): void {
    emit('toggle', props.session.id)
}
</script>

<template>
    <div class="border-b border-[color:var(--color-line)] last:border-b-0">
        <button
            type="button"
            class="flex w-full items-center justify-between gap-[1.2rem] px-[0.4rem] py-[1.4rem] text-left transition-colors hover:bg-surface-base"
            @click="handleToggle"
        >
            <div class="flex flex-1 flex-col gap-[0.2rem]">
                <p class="font-serif text-[1.5rem] font-medium leading-[1.25] tracking-[-0.01em] text-text-primary">
                    {{ session.caseTitle }}
                </p>
                <p class="text-[1.15rem] text-text-tertiary">
                    {{ session.patientName }} &middot; {{ formatDate(session.updatedAt) }}
                </p>
            </div>
            <div class="flex shrink-0 items-center gap-[1rem]">
                <span
                    class="inline-flex items-center gap-[0.4rem] rounded-full px-[1rem] py-[0.3rem] text-eyebrow-sm"
                    :class="isCompleted
                        ? 'bg-brand-ghost text-brand-deep'
                        : 'bg-[color:var(--color-amber-soft)] text-[color:var(--color-amber-text)]'"
                >
                    {{ isCompleted ? 'Завершён' : 'Не завершён' }}
                </span>
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    class="text-text-tertiary transition-transform"
                    :style="{ transform: isExpanded ? 'rotate(180deg)' : 'none' }"
                ><path
                    d="M4 5.5l3 3 3-3"
                    stroke="currentColor"
                    stroke-width="1.4"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                /></svg>
            </div>
        </button>

        <div
            v-if="isExpanded"
            class="pb-[1.6rem] pl-[0.4rem]"
        >
            <div
                v-if="isDetailLoading"
                class="flex flex-col gap-[0.8rem] py-[0.8rem]"
            >
                <VSkeleton height="2rem" />
                <VSkeleton
                    width="80%"
                    height="2rem"
                />
            </div>

            <template v-else-if="detail">
                <div
                    v-if="detail.score"
                    class="mb-[1.6rem] grid grid-cols-3 gap-[0.8rem] sm:grid-cols-5"
                >
                    <div
                        v-for="[key, label] in SCORE_LABELS"
                        :key="key"
                        class="flex flex-col items-center gap-[0.2rem] rounded-[0.8rem] border border-[color:var(--color-line)] bg-surface-base p-[1rem] text-center"
                    >
                        <p class="text-eyebrow-sm text-text-tertiary">{{ label }}</p>
                        <p class="font-serif text-[1.8rem] font-medium text-text-primary">
                            {{ formatScore(detail.score[key]) }}
                        </p>
                    </div>
                </div>

                <p
                    v-if="detail.result"
                    class="mb-[1.6rem] rounded-[0.8rem] border border-[color:rgb(13_115_119_/_0.2)] bg-brand-ghost p-[1.2rem] font-serif text-[1.4rem] italic leading-[1.5] text-text-primary"
                >
                    &laquo;{{ detail.result.summary }}&raquo;
                </p>

                <div class="flex flex-col gap-[0.8rem]">
                    <div
                        v-for="msg in detail.messages"
                        :key="msg.id"
                        class="text-[1.3rem] leading-[1.55]"
                    >
                        <span class="font-mono text-eyebrow-sm text-text-tertiary">
                            {{ ROLE_LABEL[msg.role] }}:
                        </span>
                        <span class="ml-[0.4rem] text-text-primary">{{ msg.content }}</span>
                    </div>
                </div>
            </template>

            <p
                v-else
                class="text-[1.3rem] text-text-secondary"
            >
                Детали сессии недоступны.
            </p>
        </div>
    </div>
</template>
