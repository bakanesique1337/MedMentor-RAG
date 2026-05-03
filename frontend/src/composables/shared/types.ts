/**
 * Три формы русского множественного числа: [для 1, для 2..4, для 0/5..20].
 * Например: ['задача', 'задачи', 'задач'].
 */
export type PluralForms = readonly [string, string, string]

/**
 * Подписчик на событие 401 от REST-слоя. Принимает URL запроса, который вернул 401.
 */
export type UnauthorizedHandler = (requestUrl: string) => void
