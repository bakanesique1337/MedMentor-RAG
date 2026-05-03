/**
 * @file Низкоуровневые HTTP-хелперы для всего REST-слоя фронтенда.
 *
 * Все API composables используют apiGet/apiPost/apiPut из этого модуля и за счёт этого получают
 * единое поведение:
 *  - cookie-credentials (session cookie прокидывается автоматически),
 *  - таймаут запросов (REQUEST_TIMEOUT_MS),
 *  - нормализацию любой ошибки до ApiError,
 *  - глобальную реакцию на 401 через шину authBus (для всех не-auth путей).
 *
 * Все экспортируемые функции бросают ApiError, чтобы вызывающему коду
 * не приходилось разбирать формат ошибок vueuse.
 */

import type {ApiRequestOptions, FetchResponseRefs} from './types'
import type {ApiError} from '@/types'
import {createFetch} from '@vueuse/core'
import {isApiError} from '@/utils/typeGuards'
import {emitUnauthorized} from '@/composables/shared/authBus'
import {API_BASE_URL, REQUEST_TIMEOUT_MS} from '@/constants/api'
import {HTTP_STATUS_UNAUTHORIZED} from '@/constants/http'

/**
 * Auth-эндпоинты, для которых не запускается глобальная обработка 401.
 */
const AUTH_ENDPOINTS = new Set(['/api/auth/login', '/api/auth/logout', '/api/auth/me'])

/**
 * Конструирует ApiError из произвольного тела ошибки.
 *
 * @param status HTTP-статус ответа
 * @param body тело ответа от бэкенда (произвольной формы)
 * @returns нормализованный ApiError
 */
function buildApiError(status: number, body: unknown): ApiError {
    if (isApiError(body)) {
        return body
    }

    const message = typeof body === 'object' && body !== null && 'error' in body
        ? String((body as Record<string, unknown>).error)
        : 'Request failed'

    return {error: message, status}
}

/**
 * Приводит любую ошибку запроса к единому ApiError.
 * status === 0 означает, что HTTP-ответа не было вовсе: таймаут, обрыв сети,
 * CORS-ошибка. В этом случае берёт текст из transportError (Error.message),
 * чтобы не показывать в UI пустое сообщение. Для обычных HTTP-ошибок (4xx/5xx)
 * делегирует работу buildApiError.
 *
 * @param status HTTP-статус или 0 для transport-уровневой ошибки
 * @param body тело ответа, если оно вообще пришло
 * @param transportError ошибка fetch, если запрос упал до получения ответа
 * @returns нормализованный ApiError
 */
function normalizeError(status: number, body: unknown, transportError?: unknown): ApiError {
    if (status === 0) {
        const message = transportError instanceof Error
            ? transportError.message
            : 'Network error'
        return {error: message, status: 0}
    }

    return buildApiError(status, body)
}

/**
 * Общая для всего приложения фабрика fetch-запросов.
 * combination: 'overwrite' гарантирует, что параметры конкретного вызова
 * переписывают дефолтные опции, а не сливаются с ними (важно для signal).
 * beforeFetch включает credentials и AbortSignal, чтобы запросы
 * не висели на медленных бэкенд-вызовах.
 */
const useSharedFetch = createFetch({
    baseUrl: API_BASE_URL,
    combination: 'overwrite',
    options: {
        beforeFetch({options}) {
            options.credentials = 'include'
            options.signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS)
            return {options}
        },
        async onFetchError(ctx) {
            const status = ctx.response?.status ?? 0
            ctx.error = normalizeError(status, ctx.data, ctx.error)
            return ctx
        },
    },
})

/**
 * Дописывает query-параметры к URL. Если params пустой или undefined,
 * URL возвращается как есть, без хвостового '?', чтобы не ломать сравнение
 * URL в логах и кэширование.
 *
 * @param url базовый путь без query-строки
 * @param params необязательные query-параметры; значения приводятся к строке
 * @returns URL с дописанными query-параметрами
 */
function buildUrl(url: string, params?: Record<string, string | number | boolean>): string {
    if (params === undefined || Object.keys(params).length === 0) {
        return url
    }

    const query = new URLSearchParams()

    for (const [key, value] of Object.entries(params)) {
        query.set(key, String(value))
    }

    return `${url}?${query.toString()}`
}

/**
 * Распаковывает ответ vueuse useFetch в типизированные данные или бросает
 * ApiError.
 *
 * Логика:
 *  1. Если в response есть ошибка - приводит её к ApiError (если ещё не приведена).
 *  2. На статусе 401 для не-auth эндпоинтов кидает событие в auth-шину, чтобы
 *     store обнулил пользователя и перевёл роутер на /login.
 *  3. Бросает ApiError наверх - вызывающий код решает, как его показать.
 *  4. На успешном ответе возвращает data.value
 *
 * @template T ожидаемый тип данных ответа
 * @param url исходный URL запроса
 * @param response refs ответа от vueuse useFetch().json()
 * @returns распакованные данные типа T
 * @throws ApiError при transport- или HTTP-ошибке
 */
function unwrapResponse<T>(url: string, response: FetchResponseRefs<T>): T {
    const {data, error, statusCode} = response

    if (error.value !== null && error.value !== undefined) {
        const apiError = isApiError(error.value)
            ? error.value
            : normalizeError(statusCode.value || 0, data.value, error.value)

        if (apiError.status === HTTP_STATUS_UNAUTHORIZED && !AUTH_ENDPOINTS.has(url)) {
            emitUnauthorized(url)
        }

        throw apiError
    }

    return data.value as T
}

/**
 * Валидирует и приводит идентификатор сессии (число или строка из маршрута)
 * к положительному целому числу.
 *
 * @param raw идентификатор сессии числом или строкой (например, из route.params.id)
 * @returns валидный положительный integer
 * @throws TypeError если raw нельзя привести к положительному integer
 */
export function toSessionId(raw: number | string): number {
    const parsed = typeof raw === 'number' ? raw : parseInt(raw, 10)

    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new TypeError(`Invalid sessionId: ${String(raw)}`)
    }

    return parsed
}

/**
 * Выполняет GET-запрос и возвращает типизированные данные.
 * Поддерживает query-параметры и AbortSignal для отмены при unmount/route change.
 *
 * @template T ожидаемый тип ответа
 * @param url путь относительно API_BASE_URL, начинающийся с '/'
 * @param options query-параметры и/или AbortSignal
 * @returns Promise с распакованным телом ответа
 * @throws ApiError при transport- или HTTP-ошибке
 */
export async function apiGet<T>(url: string, options?: ApiRequestOptions): Promise<T> {
    const fullUrl = buildUrl(url, options?.params)
    const response = await useSharedFetch<T>(fullUrl, {signal: options?.signal})
        .get()
        .json<T>()

    return unwrapResponse<T>(url, response)
}

/**
 * Выполняет POST-запрос с JSON-телом и возвращает типизированные данные.
 *
 * @template TResponse ожидаемый тип ответа
 * @template TBody тип тела запроса (по умолчанию unknown)
 * @param url путь относительно API_BASE_URL
 * @param body тело запроса; undefined превращается в пустой объект
 * @param options AbortSignal для отмены запроса
 * @returns Promise с распакованным телом ответа
 * @throws ApiError при transport- или HTTP-ошибке
 */
export async function apiPost<TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    options?: ApiRequestOptions,
): Promise<TResponse> {
    const response = await useSharedFetch<TResponse>(url, {signal: options?.signal})
        .post(body ?? {})
        .json<TResponse>()

    return unwrapResponse<TResponse>(url, response)
}

/**
 * Выполняет PUT-запрос с JSON-телом и возвращает типизированные данные.
 *
 * @template TResponse ожидаемый тип ответа
 * @template TBody тип тела запроса
 * @param url путь относительно API_BASE_URL
 * @param body тело запроса (для PUT обязательно: иначе нечего обновлять)
 * @param options AbortSignal для отмены запроса
 * @returns Promise с распакованным телом ответа
 * @throws ApiError при transport- или HTTP-ошибке
 */
export async function apiPut<TResponse, TBody = unknown>(
    url: string,
    body: TBody,
    options?: ApiRequestOptions,
): Promise<TResponse> {
    const response = await useSharedFetch<TResponse>(url, {signal: options?.signal})
        .put(body)
        .json<TResponse>()

    return unwrapResponse<TResponse>(url, response)
}
