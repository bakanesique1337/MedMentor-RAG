<script setup lang="ts">
import {nextTick, ref, useTemplateRef, watch} from 'vue'

import type {SimulationQuickPrompt, SimulationQuickPromptKey} from '@/constants/simulationQuickPrompts'

const COPY = {
    quickPromptsHint: 'Подсказки ↴',
    placeholder: 'Задайте вопрос пациенту или опишите действие...',
    sending: 'Отправка...',
    send: 'Отправить',
    keyboardHint: 'Enter — отправить · Shift + Enter — новая строка',
    versionTag: 'MedMentor-RAG v0.5',
} as const

interface Props {
    disabled: boolean
    isSendPending: boolean
    quickPrompts: readonly SimulationQuickPrompt[]
    disabledQuickPromptKeys: ReadonlySet<SimulationQuickPromptKey>
}

const emit = defineEmits<{
    send: [content: string, narratorPrompt?: string]
    'request-exam': [content?: string]
}>()

const props = defineProps<Props>()

const message = ref('')
const textareaRef = useTemplateRef<HTMLTextAreaElement>('textareaRef')

function resizeTextarea(): void {
    const el = textareaRef.value
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
}

watch(message, () => {
    nextTick(resizeTextarea)
})

/**
 * Emits the current message and clears the input.
 */
function handleSend(): void {
    const trimmed = message.value.trim()
    if (props.disabled || props.isSendPending || !trimmed) return
    emit('send', trimmed)
    message.value = ''
    nextTick(resizeTextarea)
}

/**
 * Отправляет заранее заготовленный quick-prompt.
 *
 * Для action='exam' это чистое системное действие (как и боковая кнопка
 * в сайдбаре): дёргаем request-exam без content, в ленте появляется только
 * SYSTEM-карточка осмотра, реплика врача не сохраняется. Для обычных
 * prompt'ов идёт штатный send с текстом; если у prompt'а задан narratorPrompt,
 * он уйдёт нарратору вместо content (см. SimulationQuickPrompt).
 */
function handleQuickPrompt(prompt: SimulationQuickPrompt): void {
    if (props.disabled || props.isSendPending) return
    if (props.disabledQuickPromptKeys.has(prompt.key)) return
    if (prompt.action === 'exam') {
        emit('request-exam')
        return
    }
    if (prompt.content !== undefined) {
        emit('send', prompt.content, prompt.narratorPrompt)
    }
}

function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        handleSend()
    }
}
</script>

<template>
    <div class="shrink-0 border-t border-(--color-line-2) bg-surface-base px-[2.4rem] pb-[1.6rem] pt-[1.2rem]">
        <div class="mx-auto w-full max-w-336">
            <div class="mb-4 flex flex-wrap items-center gap-[0.6rem]">
                <span class="pr-[0.4rem] text-eyebrow-sm text-text-tertiary">{{ COPY.quickPromptsHint }}</span>
                <button
                    v-for="prompt in quickPrompts"
                    :key="prompt.key"
                    type="button"
                    class="rounded-full border px-4 py-2 text-[1.2rem] font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
                    :class="prompt.action === 'exam'
                        ? 'border-(--color-teal-deep) bg-brand text-white hover:bg-brand-deep'
                        : 'border-(--color-teal-soft) bg-brand-ghost text-brand-deep hover:bg-brand-soft'"
                    :disabled="disabled || disabledQuickPromptKeys.has(prompt.key)"
                    @click="handleQuickPrompt(prompt)"
                >
                    {{ prompt.label }}
                </button>
            </div>

            <div
                class="flex items-center gap-4 rounded-[1.2rem] border border-(--color-line-2) bg-white px-[1.2rem] py-4 shadow-[0_2px_10px_rgb(10_31_31/0.04)]"
            >
                <textarea
                    ref="textareaRef"
                    v-model="message"
                    :placeholder="COPY.placeholder"
                    rows="1"
                    class="min-h-[2.2rem] max-h-64 min-w-0 flex-1 resize-none border-0 bg-transparent p-0 text-[1.4rem] leading-normal text-text-primary outline-none placeholder:text-text-tertiary"
                    :disabled="disabled"
                    @keydown="handleKeydown"
                />
                <button
                    type="button"
                    class="inline-flex h-[3.4rem] items-center gap-[0.6rem] rounded-sm bg-brand px-[1.4rem] text-[1.25rem] font-medium text-white shadow-primary transition hover:bg-brand-deep disabled:opacity-50"
                    :disabled="disabled || isSendPending || message.trim() === ''"
                    @click="handleSend"
                >
                    <template v-if="isSendPending">{{ COPY.sending }}</template>
                    <template v-else>
                        {{ COPY.send }}
                        <svg
                            width="10"
                            height="10"
                            viewBox="0 0 10 10"
                        >
                            <path
                                d="M1 5h8M6 2l3 3-3 3"
                                stroke="currentColor"
                                stroke-width="1.3"
                                fill="none"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                        </svg>
                    </template>
                </button>
            </div>

            <div
                class="mt-[0.6rem] flex flex-wrap items-center justify-between gap-x-[1.2rem] gap-y-[0.2rem] text-[1.05rem] text-text-tertiary"
            >
                <span class="flex flex-wrap items-center gap-x-[1.2rem] gap-y-[0.2rem]">
                    <span>{{ COPY.keyboardHint }}</span>
                </span>
                <span class="font-mono">{{ COPY.versionTag }}</span>
            </div>
        </div>
    </div>
</template>
