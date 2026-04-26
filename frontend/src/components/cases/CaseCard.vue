<script setup lang="ts">
import { computed } from 'vue'

import DifficultyPips from '@/components/common/DifficultyPips.vue'
import MmArrow from '@/components/common/MmArrow.vue'
import PatientAvatar from '@/components/common/PatientAvatar.vue'
import VSpinner from '@/components/ui/VSpinner.vue'
import { categoryDisplayLabel } from '@/constants/caseCategories'
import type { CaseCard } from '@/types'

const COPY = {
    yearsSuffix: 'л.',
    starting: 'Открываем...',
    resumeAction: 'Продолжить',
    startAction: 'Начать кейс',
} as const

const SEX_LABEL = {
    female: 'жен.',
    male: 'муж.',
} as const

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

const categoryLabel = computed(() => categoryDisplayLabel(props.caseData.category))

const sexLabel = computed<string>(() => {
    const sex = String(props.caseData.patientSex).toLowerCase()
    return sex === 'female' ? SEX_LABEL.female : SEX_LABEL.male
})

/**
 * Emits start event with this case's ID.
 */
function handleStart(): void {
    if (props.isActive && props.activeSessionId !== null) {
        emit('resume', props.activeSessionId)
        return
    }
    emit('start', props.caseData.id)
}
</script>

<template>
    <article
        class="group flex h-full cursor-pointer flex-col rounded-[1.4rem] border border-[color:var(--color-line)] bg-white p-[1.6rem] transition-all duration-200 hover:-translate-y-[0.2rem] hover:border-[color:rgb(13_115_119_/_0.25)] hover:shadow-hover-card"
        @click="handleStart"
    >
        <div class="mb-[1.2rem] flex items-center gap-[1.2rem]">
            <PatientAvatar
                :name="caseData.patientName"
                :category="caseData.category"
                :size="44"
            />
            <div class="flex min-w-0 flex-1 flex-col gap-[0.4rem]">
                <div class="truncate text-eyebrow-sm text-brand">
                    {{ categoryLabel }}
                </div>
                <div class="truncate text-[1.15rem] text-text-tertiary">
                    <span class="font-medium text-text-secondary">{{ caseData.patientName }}</span>
                    <span class="mx-[0.6rem]">&middot;</span>
                    <span>{{ caseData.patientAge }}&nbsp;{{ COPY.yearsSuffix }}</span>
                    <span class="mx-[0.6rem]">&middot;</span>
                    <span>{{ sexLabel }}</span>
                </div>
            </div>
        </div>

        <h3
            class="mb-[0.8rem] font-serif text-[1.9rem] font-medium leading-[1.22] tracking-[-0.01em] text-text-primary line-clamp-2"
        >
            {{ caseData.title }}
        </h3>

        <p
            class="mb-[1.2rem] flex-1 text-[1.25rem] leading-[1.5] text-text-secondary line-clamp-3"
        >
            {{ caseData.patientBrief }}
        </p>

        <div class="flex items-center justify-between gap-[0.8rem] border-t border-[color:var(--color-line)] pt-[1rem]">
            <DifficultyPips :level="caseData.difficulty" />
            <span class="flex items-center gap-[0.4rem] text-[1.2rem] font-medium text-brand">
                <template v-if="isStartPending">
                    <VSpinner size="sm" />
                    {{ COPY.starting }}
                </template>
                <template v-else-if="isActive">
                    {{ COPY.resumeAction }}
                    <MmArrow :size="12" />
                </template>
                <template v-else>
                    {{ COPY.startAction }}
                    <MmArrow :size="12" />
                </template>
            </span>
        </div>
    </article>
</template>

<style scoped>
.line-clamp-2 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.line-clamp-3 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
}
</style>
