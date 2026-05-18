<script setup lang="ts">
/**
 * Пузырь сообщения врача (DOCTOR) или пациента (PATIENT).
 *
 * SYSTEM-сообщения сюда не приходят — их рендерит ChatSystemBubble
 * (или ExamFindingsCard для маркера __EXAM_CARD__). MENTOR-сообщения
 * рендерит OutOfScopeBlock. Диспетчеризация по ролям живёт в ChatTimeline.
 */
import { computed } from 'vue'

import type { MessageRole } from '@/types'
import { renderMarkdown } from '@/utils/markdown'

const COPY = {
    doctorAvatar: 'Вы',
    doctorRole: 'Вы — Студент',
    patientRole: 'Пациент',
} as const

interface Props {
    role: MessageRole
    content: string
    isStreaming?: boolean
    patientInitials?: string
}

const props = withDefaults(defineProps<Props>(), {
    isStreaming: false,
    patientInitials: 'ПС',
})

const isDoctor = computed(() => props.role === 'DOCTOR')

/**
 * HTML-версия контента сообщения, отрендеренная из markdown.
 * Пустую строку отдаём отдельно, чтобы шаблон мог показать индикатор
 * стрима до прихода первого чанка.
 */
const renderedContent = computed(() => renderMarkdown(props.content))
</script>

<template>
    <div
        class="flex items-start gap-[1.2rem] py-[0.8rem]"
        :class="isDoctor ? 'flex-row-reverse' : 'flex-row'"
    >
        <div
            class="flex size-[3.2rem] shrink-0 items-center justify-center rounded-full text-[1.1rem] font-bold text-white"
            :style="isDoctor
                ? 'background: linear-gradient(135deg, var(--color-teal-deep), #062e30); box-shadow: 0 2px 8px rgb(13 115 119 / 0.25);'
                : 'background: linear-gradient(135deg, #3a4a48, #1e2e2c); box-shadow: 0 1px 3px rgb(10 31 31 / 0.15);'"
        >
            {{ isDoctor ? COPY.doctorAvatar : patientInitials }}
        </div>

        <div
            class="flex max-w-[70%] flex-col"
            :class="isDoctor ? 'items-end' : 'items-start'"
        >
            <p class="mb-[0.4rem] text-eyebrow-sm text-text-secondary">
                {{ isDoctor ? COPY.doctorRole : COPY.patientRole }}
            </p>
            <div
                class="chat-md break-words px-[1.4rem] py-[1.1rem] text-[1.4rem] leading-[1.5]"
                :class="isDoctor
                    ? 'rounded-[1.4rem_0.4rem_1.4rem_1.4rem] bg-brand text-white shadow-[0_2px_8px_rgb(13_115_119_/_0.18)]'
                    : 'rounded-[0.4rem_1.4rem_1.4rem_1.4rem] border border-[color:var(--color-line)] bg-white text-text-primary shadow-[0_1px_2px_rgb(10_31_31_/_0.03)]'"
            >
                <div
                    v-if="content"
                    v-html="renderedContent"
                />
                <span
                    v-if="isStreaming && !content"
                    class="inline-block"
                >
                    <span class="anim-blink">...</span>
                </span>
                <span
                    v-if="isStreaming && content"
                    class="anim-caret ml-[0.1rem]"
                />
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
/* Минимальная типографика для отрендеренного markdown в пузыре сообщения.
   Стили завернуты в .chat-md, чтобы не задевать остальной layout. */
.chat-md {
    /* Глобальный @layer base в assets/typography.css перекрашивает <p>/<li> в
       --text-secondary и принудительно ставит 1.5rem. Внутри пузыря это ломает
       цвет (текст становится серым на тёмно-зелёном фоне доктора) и размер,
       поэтому возвращаем наследование от родительского .chat-md. */
    :deep(p),
    :deep(li),
    :deep(dd),
    :deep(dt) {
        color: inherit;
        font-size: inherit;
        line-height: inherit;
    }

    /* Сохраняем переносы строк, но не ломаем разметку markdown-таблиц. */
    :deep(p) {
        margin: 0;
        white-space: pre-wrap;
    }

    :deep(p + p),
    :deep(p + ul),
    :deep(p + ol),
    :deep(p + h1),
    :deep(p + h2),
    :deep(p + h3),
    :deep(p + h4),
    :deep(p + table),
    :deep(p + pre),
    :deep(p + blockquote),
    :deep(ul + p),
    :deep(ol + p),
    :deep(table + p),
    :deep(pre + p),
    :deep(blockquote + p) {
        margin-top: 0.6rem;
    }

    :deep(h1),
    :deep(h2),
    :deep(h3),
    :deep(h4) {
        margin: 0.6rem 0 0.3rem;
        font-weight: 600;
        line-height: 1.25;
    }

    :deep(h1) { font-size: 1.6rem; }
    :deep(h2) { font-size: 1.5rem; }
    :deep(h3) { font-size: 1.45rem; }
    :deep(h4) { font-size: 1.4rem; }

    :deep(ul),
    :deep(ol) {
        margin: 0.3rem 0;
        padding-left: 1.8rem;
    }

    :deep(ul) { list-style: disc; }
    :deep(ol) { list-style: decimal; }
    :deep(li + li) { margin-top: 0.2rem; }

    :deep(strong) { font-weight: 600; }
    :deep(em) { font-style: italic; }

    :deep(code) {
        padding: 0.1rem 0.4rem;
        border-radius: 0.4rem;
        background: rgb(10 31 31 / 0.08);
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.9em;
    }

    :deep(pre) {
        margin: 0.5rem 0;
        padding: 0.8rem 1rem;
        overflow-x: auto;
        border-radius: 0.6rem;
        background: rgb(10 31 31 / 0.08);

        code {
            padding: 0;
            background: transparent;
        }
    }

    :deep(blockquote) {
        margin: 0.4rem 0;
        padding-left: 1rem;
        border-left: 0.3rem solid rgb(10 31 31 / 0.15);
        color: inherit;
        opacity: 0.85;
    }

    :deep(table) {
        margin: 0.5rem 0;
        border-collapse: collapse;
        width: 100%;
        font-size: 1.3rem;
    }

    :deep(th),
    :deep(td) {
        padding: 0.4rem 0.7rem;
        border: 0.1rem solid rgb(10 31 31 / 0.12);
        text-align: left;
        vertical-align: top;
    }

    :deep(th) {
        background: rgb(10 31 31 / 0.05);
        font-weight: 600;
    }

    :deep(a) {
        color: inherit;
        text-decoration: underline;
    }

    :deep(hr) {
        margin: 0.6rem 0;
        border: none;
        border-top: 0.1rem solid rgb(10 31 31 / 0.12);
    }
}
</style>
