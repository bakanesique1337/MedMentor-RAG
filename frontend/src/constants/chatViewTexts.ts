export const CHAT_ALERTS_TEXTS = {
    sessionUnavailableTitle: 'Сессия недоступна',
    invalidSessionId: 'Некорректный ID сессии. Вернитесь к списку кейсов.',
    openingFailedTitle: 'Опенинг не удался',
    openingFailedDescription: 'Вступление пациента не удалось сгенерировать.',
} as const

export const CHAT_ACTIONS_TEXTS = {
    backToCases: 'К списку кейсов',
    retry: 'Повторить',
} as const

export const CHAT_STATUS_TEXTS = {
    openingPending: 'Пациент готовит вступление...',
    scoring: 'Модель оценивает вашу сессию...',
} as const