<script setup lang="ts">
import { VBadge, VButton, VTag } from '@/components/ui'
import type { CaseCard } from '@/types'

interface Props {
    caseData: CaseCard
    isActive: boolean
    activeSessionId: number | null
    isStartPending: boolean
}

const emit = defineEmits<{
    start: [caseId: string]
    resume: [sessionId: number]
}>()

const props = defineProps<Props>()

const DIFFICULTY_VARIANT: Record<string, 'neutral' | 'warning' | 'error' | 'primary'> = {
    easy: 'neutral',
    beginner: 'neutral',
    medium: 'warning',
    intermediate: 'warning',
    hard: 'error',
    advanced: 'error',
}

/**
 * Returns a badge variant for the given difficulty string.
 */
function getDifficultyVariant(difficulty: string): 'neutral' | 'warning' | 'error' | 'primary' {
    return DIFFICULTY_VARIANT[difficulty.toLowerCase()] ?? 'primary'
}

/**
 * Emits the start event with this case's ID.
 */
function handleStart(): void {
    emit('start', props.caseData.id)
}

/**
 * Emits the resume event with the active session ID.
 */
function handleResume(): void {
    if (props.activeSessionId !== null) {
        emit('resume', props.activeSessionId)
    }
}
</script>

<template>
    <VCard
        variant="default"
        as="article"
    >
        <template #header>
            <div class="flex items-start justify-between gap-2">
                <h3 class="text-body font-semibold text-text-primary">{{ caseData.title }}</h3>
                <div class="flex shrink-0 flex-wrap gap-1">
                    <VBadge variant="primary">{{ caseData.category }}</VBadge>
                    <VBadge :variant="getDifficultyVariant(caseData.difficulty)">
                        {{ caseData.difficulty }}
                    </VBadge>
                </div>
            </div>
        </template>

        <div class="flex flex-col gap-3">
            <div>
                <p class="text-body-sm font-medium text-text-primary">{{ caseData.patientName }}</p>
                <p class="text-label text-text-secondary">
                    {{ caseData.patientAge }} years &middot; {{ caseData.patientSex }}
                </p>
            </div>

            <p class="text-body-sm text-text-secondary">{{ caseData.patientBrief }}</p>

            <div
                v-if="caseData.tags.length > 0"
                class="flex flex-wrap gap-1"
            >
                <VTag
                    v-for="tag in caseData.tags"
                    :key="tag"
                    variant="neutral"
                >{{ tag }}</VTag>
            </div>

            <div class="flex flex-wrap gap-2 pt-1">
                <VButton
                    v-if="isActive && activeSessionId !== null"
                    size="sm"
                    @click="handleResume"
                >
                    Resume session
                </VButton>
                <VButton
                    v-else
                    size="sm"
                    variant="secondary"
                    :disabled="isStartPending"
                    :loading="isStartPending"
                    @click="handleStart"
                >
                    Start case
                </VButton>
            </div>
        </div>
    </VCard>
</template>
