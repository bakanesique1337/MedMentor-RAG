/**
 * Шина событий с одним подписчиком для событий аутентификационной сессии.
 *
 * Разрывает циклическую зависимость импортов между useApi (детектирует
 * ответы 401) и authGate (отвечает за инвалидацию сессии и навигацию).
 */

import type {UnauthorizedHandler} from './types'

let unauthorizedHandler: UnauthorizedHandler | null = null

/**
 * Регистрирует обработчик, вызываемый, когда не относящийся к аутентификации
 * запрос к API возвращает 401.
 * Может быть зарегистрирован только один обработчик; последующие вызовы
 * перезаписывают предыдущий.
 *
 * @param handler — функция-подписчик, получающая URL запроса с ответом 401.
 */
export function onUnauthorized(handler: UnauthorizedHandler): void {
    unauthorizedHandler = handler
}

/**
 * Уведомляет подписчика о событии 401, передавая URL запроса, который его вызвал.
 * Если обработчик не зарегистрирован — ничего не делает.
 *
 * @param requestUrl — URL запроса, который вернул статус 401.
 */
export function emitUnauthorized(requestUrl: string): void {
    unauthorizedHandler?.(requestUrl)
}
