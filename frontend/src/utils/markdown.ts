/**
 * @file Безопасный рендер markdown-сообщений чата в HTML.
 *
 * Один общий экземпляр markdown-it переиспользуется на всё приложение —
 * парсер заметно тяжелее самой реакции v-html, и плодить инстансы
 * на каждый рендер бессмысленно.
 *
 * Безопасность: HTML в источнике запрещён (`html: false`), поэтому LLM
 * не может протащить теги в DOM через markdown-источник. Этого достаточно
 * для контролируемого ввода из бэкенда; если в будущем здесь начнут
 * рендериться произвольные пользовательские ссылки, стоит добавить
 * sanitizer поверх (например, DOMPurify).
 */
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({
    html: false,
    linkify: true,
    breaks: true,
    typographer: true,
})

/**
 * Преобразует markdown-строку в HTML.
 *
 * @param source — исходный markdown-текст сообщения.
 * @returns HTML-строка для вставки через `v-html`.
 */
export function renderMarkdown(source: string): string {
    if (!source) {
        return ''
    }
    return md.render(source)
}
