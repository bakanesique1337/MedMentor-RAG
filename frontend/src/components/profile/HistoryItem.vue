<script setup lang="ts">
import { VBadge, VSkeleton } from '@/components/ui'
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
    ['politeness', 'Politeness'],
    ['questioningStructure', 'Questioning'],
    ['thoroughness', 'Thoroughness'],
    ['empathy', 'Empathy'],
    ['diagnosisCorrect', 'Diagnosis'],
]

const ROLE_LABEL: Record<MessageRole, string> = {
    DOCTOR: 'Doctor',
    PATIENT: 'Patient',
    SYSTEM: 'System',
}

/**
 * Returns a short locale date string for display.
 */
function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

/**
 * Formats a 0-1 score as a percentage string.
 */
function formatScore(value: number | null): string {
    if (value === null) return 'N/A'
    return `${Math.round(value * 100)}%`
}

/**
 * Emits toggle for this session entry.
 */
function handleToggle(): void {
    emit('toggle', props.session.id)
}
</script>

<template>
    <div class="border-b border-border-subtle last:border-b-0">
        <!-- Summary row -->
        <button
            type="button"
            class="flex w-full items-center justify-between gap-3 px-1 py-3 text-left transition-colors hover:bg-interactive-ghost-hover"
            @click="handleToggle"
        >
            <div class="flex flex-1 flex-col gap-0.5">
                <p class="text-body-sm font-medium text-text-primary">{{ session.caseTitle }}</p>
                <p class="text-label text-text-secondary">
                    {{ session.patientName }} &middot; {{ formatDate(session.updatedAt) }}
                </p>
            </div>
            <div class="flex shrink-0 items-center gap-2">
                <VBadge
                    v-if="session.state === 'COMPLETED'"
                    variant="success"
                >
                    Completed
                </VBadge>
                <VBadge
                    v-else
                    variant="warning"
                >
                    Incomplete
                </VBadge>
                <span
                    class="text-label text-text-tertiary"
                    aria-hidden="true"
                >{{ isExpanded ? '-' : '+' }}</span>
            </div>
        </button>

        <!-- Expanded detail -->
        <div
            v-if="isExpanded"
            class="pb-4 pl-1"
        >
            <!-- Loading -->
            <div
                v-if="isDetailLoading"
                class="flex flex-col gap-2 py-2"
            >
                <VSkeleton
                    height="2rem"
                    shape="rectangle"
                />
                <VSkeleton
                    width="80%"
                    height="2rem"
                    shape="rectangle"
                />
            </div>

            <template v-else-if="detail">
                <!-- Score grid -->
                <div
                    v-if="detail.score"
                    class="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-5"
                >
                    <div
                        v-for="[key, label] in SCORE_LABELS"
                        :key="key"
                        class="flex flex-col items-center gap-0.5 rounded-xl border border-border-subtle bg-surface-sunken p-2 text-center"
                    >
                        <p class="text-label text-text-secondary">{{ label }}</p>
                        <p class="text-body-sm font-semibold text-text-primary">
                            {{ formatScore(detail.score[key]) }}
                        </p>
                    </div>
                </div>

                <!-- Result summary -->
                <p
                    v-if="detail.result"
                    class="mb-4 text-body-sm text-text-secondary"
                >
                    {{ detail.result.summary }}
                </p>

                <!-- Conversation -->
                <div class="flex flex-col gap-1.5">
                    <div
                        v-for="msg in detail.messages"
                        :key="msg.id"
                        class="text-body-sm"
                    >
                        <span class="font-medium text-text-tertiary">{{ ROLE_LABEL[msg.role] }}:</span>
                        <span class="ml-1 text-text-secondary">{{ msg.content }}</span>
                    </div>
                </div>
            </template>

            <p
                v-else
                class="text-body-sm text-text-secondary"
            >
                Session details are not available.
            </p>
        </div>
    </div>
</template>
