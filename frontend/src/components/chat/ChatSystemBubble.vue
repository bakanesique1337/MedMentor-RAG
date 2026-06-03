<script setup lang="ts">
/**
 * @file ChatSystemBubble — карточка SYSTEM-сообщения в ленте симуляции.
 *
 * Используется для ответов модели на лабораторные/инструментальные запросы,
 * которые приходят не от лица пациента, а как структурированная клиническая
 * карточка в markdown. Визуально отделена от пузырей доктора/пациента:
 * не привязана к стороне, помечена «system»-эйбровом и описанием, имеет
 * мятный фон в общем стиле ExamFindingsCard.
 */
import { computed } from 'vue'

import { renderMarkdown } from '@/utils/markdown'

const COPY = {
    header: 'Данные исследований · Структурированный ответ системы',
} as const

interface Props {
    content: string
    isStreaming?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    isStreaming: false,
})

const renderedContent = computed(() => renderMarkdown(props.content))
</script>

<template>
    <div class="my-[1.2rem] flex w-full justify-start">
        <div
            class="ml-[4.4rem] flex w-full max-w-[68rem] flex-col gap-[0.8rem] rounded-[1rem] border border-[color:rgb(13_115_119_/_0.2)] p-[1.6rem]"
            style="background: linear-gradient(180deg, rgb(213 233 232 / 55%) 0%, rgb(213 233 232 / 25%) 100%);"
        >
            <p class="text-eyebrow font-mono text-brand-deep">
                {{ COPY.header }}
            </p>

            <div
                v-if="content"
                class="chat-md break-words text-[1.4rem] leading-[1.5] text-text-primary"
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
</template>

<style scoped lang="scss">
/* Дублируем минимальную типографику для markdown — общий @layer base
   перекрашивает <p>/<li> в --text-secondary и навязывает 1.5rem, поэтому
   возвращаем наследование от .chat-md внутри карточки. */
.chat-md {
    :deep(p),
    :deep(li),
    :deep(dd),
    :deep(dt) {
        color: inherit;
        font-size: inherit;
        line-height: inherit;
    }

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
        background: rgb(255 255 255 / 0.6);
    }

    :deep(th) {
        background: rgb(255 255 255 / 0.85);
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
