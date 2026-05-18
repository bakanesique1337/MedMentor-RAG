/**
 * @file Быстрые подсказки ("quick-prompts") для чата симуляции.
 *
 * Каждый prompt — это типовое действие врача, которое отправляется в LLM
 * одной кнопкой, чтобы пользователь не печатал длинную формулировку вручную.
 */

/**
 * Ключи быстрых подсказок. Используются как стабильный идентификатор
 */
export type SimulationQuickPromptKey =
    | 'physical-exam'
    | 'lab-diagnostics'
    | 'instrumental-diagnostics'

/**
 * Тип побочного действия quick-prompt'а.
 */
export type SimulationQuickPromptAction = 'exam' | null

/**
 * Описание одного quick-prompt'а.
 *
 * Поле {@code content} необязательное: для prompt'ов с {@code action='exam'}
 * никакая реплика врача в ленту не уходит — это чистое системное действие,
 * аналогичное боковой кнопке «Провести осмотр» в сайдбаре. Для остальных
 * prompt'ов (action=null) {@code content} обязателен и шлётся через /message.
 */
export interface SimulationQuickPrompt {
    key: SimulationQuickPromptKey
    label: string
    content?: string
    action: SimulationQuickPromptAction
}

/**
 * Полный список доступных quick-prompt'ов.
 */
export const SIMULATION_QUICK_PROMPTS: readonly SimulationQuickPrompt[] = [
    {
        key: 'physical-exam',
        label: 'Провести осмотр',
        // content намеренно отсутствует: общий физикальный осмотр — это действие
        // без реплики врача в ленте. Результат — только SYSTEM-карточка
        // с витальными показателями и паспортом пациента.
        action: 'exam',
    },
    {
        key: 'lab-diagnostics',
        label: 'Лабораторные данные',
        content: 'Давайте назначим лабораторные исследования и посмотрим '
            + 'доступные результаты по этому пациенту: название анализа, значение, '
            + 'единицы измерения и интерпретацию, если они есть в данных кейса.',
        action: null,
    },
    {
        key: 'instrumental-diagnostics',
        label: 'Инструментальная диагностика',
        content: 'Давайте запросим инструментальные и визуализирующие исследования '
            + 'по этому пациенту: модальность, ключевые находки и формальное '
            + 'заключение, если они есть в данных кейса.',
        action: null,
    },
] as const
