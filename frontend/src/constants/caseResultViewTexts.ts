import type {Score} from '@/types'

export type CriterionScoreKey = Exclude<keyof Score, 'createdAt' | 'diagnosisMatch' | 'totalScore'>

export const RESULT_ACTIONS_TEXTS = {
    backToCases: 'К списку задач',
    restart: 'Начать заново',
} as const

export const RESULT_ALERTS_TEXTS = {
    sessionUnavailableTitle: 'Сессия недоступна',
    invalidSessionId: 'Некорректный ID сессии. Вернитесь к списку кейсов.',
    sessionNotFound: 'Сессия не найдена или недоступна. Вернитесь к списку кейсов.',
    restartFailed: 'Не удалось начать новый кейс. Попробуйте снова.',
} as const

export const RESULT_ABANDONED_TEXTS = {
    eyebrowLabel: 'Задача не завершёна',
    title: 'Задача завершёна без диагноза.',
    description: 'Прогресс сохранён, но баллы за диагностическую точность не выставлены. Можно начать кейс заново и пройти его до конца.',
} as const

export const RESULT_HERO_TEXTS = {
    eyebrowLabel: 'Разбор задачи',
    titleLead: 'Разбор вашей',
    titleAccent: 'диагностики',
    description: 'Модель оценила ход рассуждения, полноту анамнеза и точность диагноза. Режим только для чтения.',
} as const

export const RESULT_SECTION_TITLES = {
    diagnosisCompare: 'Ваш диагноз vs эталон',
    criteria: 'Оценка по критериям',
    keyTurns: 'Ключевые ходы в диалоге',
    missed: 'Что было упущено',
    recommendations: 'Рекомендации модели',
} as const

export const RESULT_DIAGNOSIS_TEXTS = {
    yourAnswer: 'Ваш ответ',
    reference: 'Эталонный диагноз',
    emptyValue: '—',
} as const

export const RESULT_VERSION_TAG = `МедМентор-RAG v${__APP_VERSION__}`

export const RESULT_CRITERIA_LABELS: Record<CriterionScoreKey, string> = {
    thoroughness: 'Сбор анамнеза',
    questioningStructure: 'Логика рассуждения',
    empathy: 'Эмпатия',
    politeness: 'Вежливость',
    diagnosisCorrect: 'Точность диагноза',
}