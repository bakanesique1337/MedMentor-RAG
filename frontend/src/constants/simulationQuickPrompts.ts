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
 * Описание одного quick-prompt'а
 */
export interface SimulationQuickPrompt {
    key: SimulationQuickPromptKey
    label: string
    content: string
    action: SimulationQuickPromptAction
}

/**
 * Полный список доступных quick-prompt'ов.
 */
export const SIMULATION_QUICK_PROMPTS: readonly SimulationQuickPrompt[] = [
    {
        key: 'physical-exam',
        label: 'Провести осмотр',
        content: 'Проведите физикальный осмотр пациента: оцените общее состояние, '
            + 'снимите витальные показатели (АД, ЧСС, ЧДД, SpO₂, температуру) и опишите '
            + 'ключевые находки по системам. Используйте только данные, доступные в кейсе.',
        action: 'exam',
    },
    {
        key: 'lab-diagnostics',
        label: 'Лабораторные данные',
        content: 'Назначьте лабораторные исследования и запросите доступные результаты для этого пациента. '
            + 'Укажите название анализа, значение, единицы измерения и интерпретацию, если они есть в данных кейса.',
        action: null,
    },
    {
        key: 'instrumental-diagnostics',
        label: 'Инструментальная диагностика',
        content: 'Запросите инструментальные и визуализирующие исследования для этого пациента. '
            + 'Укажите модальность, ключевые находки и формальное заключение, если они есть в данных кейса.',
        action: null,
    },
] as const
