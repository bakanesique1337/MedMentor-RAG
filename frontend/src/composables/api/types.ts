/**
 * @file Локальные типы options для api-модулей.
 */

import type {Ref} from 'vue'

/**
 * Опции запроса для apiGet/apiPost/apiPut.
 */
export interface ApiRequestOptions {
    /** Query-параметры */
    params?: Record<string, string | number | boolean>;
    /** Сигнал отмены */
    signal?: AbortSignal;
}

/**
 * Дополнительные опции для GET /api/simulations/{id}.
 *
 * retryOpening=true заставляет бэкенд перегенерировать вступительную реплику
 * пациента - используется, если первая попытка стрима упала с OPENING_FAILED
 * и пользователь нажал кнопку повторить.
 */
export interface GetSessionOptions {
    /** Запросить серверную перегенерацию вступительной реплики. */
    retryOpening?: boolean;
}

/**
 * Структура ответа vueuse useFetch().json(): vueuse возвращает поля через refs,
 * чтобы значения были реактивны во время выполнения запроса.
 *
 * @template T тип, в который декодируется тело ответа
 */
export interface FetchResponseRefs<T> {
    data: Ref<T | null>;
    error: Ref<unknown>;
    statusCode: Ref<number | null>;
}

/**
 * Тело payload для эндпоинта POST /api/simulations/{id}/diagnose.
 */
export interface DiagnosePayload {
    diagnosis: string;
    rationale: string | null;
    confidence: number | null;
}
