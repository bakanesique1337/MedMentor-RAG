<script setup lang="ts">
import { ref } from 'vue'

import MmArrow from '@/components/common/MmArrow.vue'

const COPY = {
    eyebrow: 'Финальный диагноз',
    titleLead: 'Подтвердите',
    titleAccent: 'диагноз',
    description: 'После подтверждения симуляция завершится, и модель сравнит ваш ответ с эталоном.',
    submitting: 'Подтверждаем...',
    submit: 'Подтвердить и завершить',
} as const

interface Props {
    diagnosisOptions: string[]
    isPending: boolean
    conflictMessage: string | null
}

const emit = defineEmits<{
    diagnose: [payload: { diagnosis: string; rationale: string | null; confidence: number | null }]
}>()

const props = defineProps<Props>()

const selected = ref<string | null>(null)

/**
 * Submits the selected diagnosis without a rationale or self-reported confidence.
 */
function handleSubmit(): void {
    if (!selected.value || props.isPending) return
    emit('diagnose', { diagnosis: selected.value, rationale: null, confidence: null })
}
</script>

<template>
    <div class="shrink-0 border-t border-[color:var(--color-line-2)] bg-surface-base px-[2.4rem] py-[2rem]">
        <div class="mx-auto w-full max-w-[84rem]">
            <p class="mb-[0.4rem] text-eyebrow text-brand">{{ COPY.eyebrow }}</p>
            <h3 class="mb-[1rem] font-serif text-[2.2rem] font-medium leading-[1.15] tracking-[-0.02em] text-text-primary">
                {{ COPY.titleLead }} <em class="italic text-brand">{{ COPY.titleAccent }}</em>
            </h3>
            <p class="mb-[1.6rem] text-[1.3rem] text-text-secondary">
                {{ COPY.description }}
            </p>

            <div
                v-if="conflictMessage"
                class="mb-[1.4rem] rounded-[0.8rem] border border-[color:rgb(181_138_78_/_0.3)] bg-[color:var(--color-amber-soft)] px-[1.4rem] py-[1rem] text-[1.3rem] text-[color:var(--color-amber-text)]"
            >
                {{ conflictMessage }}
            </div>

            <div class="mb-[1.6rem] flex flex-col gap-[0.8rem]">
                <button
                    v-for="option in diagnosisOptions"
                    :key="option"
                    type="button"
                    class="flex items-center gap-[1.2rem] rounded-[1rem] border px-[1.4rem] py-[1.2rem] text-left text-[1.35rem] leading-[1.3] transition"
                    :class="selected === option
                        ? 'border-brand bg-brand-faint text-text-primary'
                        : 'border-[color:var(--color-line-2)] bg-white text-text-primary hover:border-[color:var(--color-ink-3)]'"
                    @click="selected = option"
                >
                    <span
                        class="flex size-[1.8rem] shrink-0 items-center justify-center rounded-full border-[0.15rem]"
                        :class="selected === option ? 'border-brand bg-brand' : 'border-[color:var(--color-line-2)]'"
                    >
                        <svg
                            v-if="selected === option"
                            width="10"
                            height="10"
                            viewBox="0 0 10 10"
                        ><circle
                            cx="5"
                            cy="5"
                            r="2.5"
                            fill="white"
                        /></svg>
                    </span>
                    <span class="flex-1">{{ option }}</span>
                </button>
            </div>

            <button
                type="button"
                class="inline-flex h-[4.4rem] items-center gap-[0.8rem] rounded-[0.9rem] bg-brand px-[2rem] text-[1.4rem] font-medium text-white shadow-primary transition hover:bg-brand-deep disabled:opacity-60"
                :disabled="selected === null || isPending"
                @click="handleSubmit"
            >
                <template v-if="isPending">{{ COPY.submitting }}</template>
                <template v-else>
                    {{ COPY.submit }}
                    <MmArrow :size="12" />
                </template>
            </button>
        </div>
    </div>
</template>
