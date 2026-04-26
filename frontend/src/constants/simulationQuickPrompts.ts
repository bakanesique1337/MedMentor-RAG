export type SimulationQuickPromptKey =
    | 'physical-exam'
    | 'lab-diagnostics'
    | 'instrumental-diagnostics'

/**
 * Quick-prompt action types. `exam` quick prompts also trigger the
 * dedicated reveal-exam endpoint in addition to sending the LLM message,
 * so the sidebar passport and vitals open immediately.
 */
export type SimulationQuickPromptAction = 'exam' | null

export interface SimulationQuickPrompt {
    key: SimulationQuickPromptKey
    label: string
    content: string
    action: SimulationQuickPromptAction
}

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
