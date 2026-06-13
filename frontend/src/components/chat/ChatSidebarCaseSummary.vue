<script setup lang="ts">
import {computed} from 'vue'

import ChatSidebarStatTile from '@/components/chat/ChatSidebarStatTile.vue'
import {categoryDisplayLabel} from '@/constants/caseCategories'
import {DIFFICULTY_PRESETS, type DifficultyLevel} from '@/types'

const LABELS = {
    currentCaseEyebrow: 'Текущая задача',
    yearsSuffix: 'г.',
    difficultyLabel: 'Сложность',
    difficultyOf: '/3',
    questionsLabel: 'Вопросы',
} as const

const MAX_TURNS = 10

const DOT_KEYS = ['dot-1', 'dot-2', 'dot-3'] as const

interface Props {
    caseCategory: string
    caseTitle: string
    caseDifficulty: DifficultyLevel
    patientName: string
    patientAge: number
    doctorTurns: number
}

const props = defineProps<Props>()

const categoryLabel = computed(() => categoryDisplayLabel(props.caseCategory).toUpperCase())

const difficultyLevel = computed(() => DIFFICULTY_PRESETS[props.caseDifficulty].dotCount)

const difficultyDots = computed(() => {
    const filled = difficultyLevel.value
    return DOT_KEYS.map((key, i) => ({key, active: i < filled}))
})
</script>

<template>
    <section>
        <p class="mb-[0.6rem] text-eyebrow-sm text-dark-ink-3">
            {{ LABELS.currentCaseEyebrow }}
        </p>
        <p class="mb-[0.6rem] text-[1.05rem] font-mono font-semibold tracking-widest text-dark-teal">
            {{ categoryLabel }}
        </p>
        <h2 class="mb-[1.2rem] font-serif text-[2.2rem] font-medium leading-[1.15] tracking-[-0.01em] text-dark-ink">
            {{ caseTitle }}
        </h2>

        <div class="mb-[1.8rem] flex gap-[0.8rem]">
            <ChatSidebarStatTile :label="LABELS.difficultyLabel">
                <div class="flex items-center gap-[0.4rem]">
                    <span
                        v-for="dot in difficultyDots"
                        :key="dot.key"
                        class="size-[0.8rem] rounded-full"
                        :class="dot.active ? 'bg-dark-teal' : 'bg-dark-line-strong'"
                    />
                    <span class="ml-[0.4rem] text-[1.1rem] font-medium text-dark-ink">
                        {{ difficultyLevel }}{{ LABELS.difficultyOf }}
                    </span>
                </div>
            </ChatSidebarStatTile>

            <ChatSidebarStatTile :label="LABELS.questionsLabel">
                <p class="font-mono text-[1.4rem] font-medium tabular">
                    <span class="text-dark-teal">{{ doctorTurns }}</span>
                    <span class="text-[1.1rem] text-dark-ink-3">&nbsp;/ {{ MAX_TURNS }}</span>
                </p>
            </ChatSidebarStatTile>
        </div>
    </section>
</template>
