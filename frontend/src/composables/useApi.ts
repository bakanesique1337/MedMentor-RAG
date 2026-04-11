import { createFetch } from '@vueuse/core'

import { emitUnauthorized } from '@/composables/authBus'
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '@/constants/api'
import type { ApiError } from '@/types'
import { isApiError } from '@/types'

// Auth endpoints are excluded from global 401 handling to prevent loops.
const AUTH_ENDPOINTS = new Set(['/api/auth/login', '/api/auth/logout', '/api/auth/me'])

// ---------------------------------------------------------------------------
// Internal normalization helpers
// ---------------------------------------------------------------------------

/**
 * Builds an ApiError from a structured backend payload or a fallback string.
 */
function buildApiError(status: number, body: unknown): ApiError {
    if (isApiError(body)) {
        return body
    }

    const message = typeof body === 'object' && body !== null && 'error' in body
        ? String((body as Record<string, unknown>).error)
        : 'Request failed'

    return { error: message, status }
}

/**
 * Normalizes a failed fetch into a consistent ApiError.
 * Called for both HTTP error responses and transport-level failures.
 */
function normalizeError(status: number, body: unknown, transportError?: unknown): ApiError {
    if (status === 0) {
        const message = transportError instanceof Error
            ? transportError.message
            : 'Network error'
        return { error: message, status: 0 }
    }

    return buildApiError(status, body)
}

// ---------------------------------------------------------------------------
// Shared fetch instance
// ---------------------------------------------------------------------------

const useSharedFetch = createFetch({
    baseUrl: API_BASE_URL,
    combination: 'overwrite',
    options: {
        beforeFetch({ options }) {
            options.credentials = 'include'
            options.signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS)
            return { options }
        },
        async afterFetch(ctx) {
            return ctx
        },
        async onFetchError(ctx) {
            const status = ctx.response?.status ?? 0
            ctx.error = normalizeError(status, ctx.data, ctx.error)
            return ctx
        },
    },
})

// ---------------------------------------------------------------------------
// Public typed helpers
// ---------------------------------------------------------------------------

export interface ApiRequestOptions {
    params?: Record<string, string | number | boolean>
    signal?: AbortSignal
}

/**
 * Appends query params to a URL string if params are provided.
 */
function buildUrl(url: string, params?: Record<string, string | number | boolean>): string {
    if (!params || Object.keys(params).length === 0) {
        return url
    }

    const query = new URLSearchParams()

    for (const [key, value] of Object.entries(params)) {
        query.set(key, String(value))
    }

    return `${url}?${query.toString()}`
}

/**
 * Performs a GET request and returns typed data.
 * Throws ApiError on HTTP or transport failure.
 */
export async function apiGet<T>(url: string, options?: ApiRequestOptions): Promise<T> {
    const fullUrl = buildUrl(url, options?.params)
    const { data, error, statusCode } = await useSharedFetch<T>(fullUrl, {
        signal: options?.signal,
    }).get().json<T>()

    if (error.value !== null && error.value !== undefined) {
        const apiError = isApiError(error.value)
            ? error.value
            : normalizeError(statusCode.value ?? 0, data.value, error.value)

        if (apiError.status === 401 && !AUTH_ENDPOINTS.has(url)) {
            emitUnauthorized(url)
        }

        throw apiError
    }

    return data.value as T
}

/**
 * Performs a POST request with a JSON body and returns typed data.
 * Throws ApiError on HTTP or transport failure.
 */
export async function apiPost<TResponse, TBody = unknown>(
    url: string,
    body: TBody,
    options?: ApiRequestOptions,
): Promise<TResponse> {
    const { data, error, statusCode } = await useSharedFetch<TResponse>(url, {
        signal: options?.signal,
    }).post(body).json<TResponse>()

    if (error.value !== null && error.value !== undefined) {
        const apiError = isApiError(error.value)
            ? error.value
            : normalizeError(statusCode.value ?? 0, data.value, error.value)

        if (apiError.status === 401 && !AUTH_ENDPOINTS.has(url)) {
            emitUnauthorized(url)
        }

        throw apiError
    }

    return data.value as TResponse
}

/**
 * Performs a PUT request with a JSON body and returns typed data.
 * Throws ApiError on HTTP or transport failure.
 */
export async function apiPut<TResponse, TBody = unknown>(
    url: string,
    body: TBody,
    options?: ApiRequestOptions,
): Promise<TResponse> {
    const { data, error, statusCode } = await useSharedFetch<TResponse>(url, {
        signal: options?.signal,
    }).put(body).json<TResponse>()

    if (error.value !== null && error.value !== undefined) {
        const apiError = isApiError(error.value)
            ? error.value
            : normalizeError(statusCode.value ?? 0, data.value, error.value)

        if (apiError.status === 401 && !AUTH_ENDPOINTS.has(url)) {
            emitUnauthorized(url)
        }

        throw apiError
    }

    return data.value as TResponse
}
