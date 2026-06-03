/**
 * @file Хелпер для эндпоинтов аутентификации.
 */

import type {AuthLoginRequest, AuthUser} from '@/types'
import {isApiError} from '@/utils/typeGuards'
import {HTTP_STATUS_UNAUTHORIZED} from '@/constants/http'
import {apiGet, apiPost} from './useApi'

/**
 * Композабл для REST-эндпоинтов аутентификации.
 *
 * @returns объект с методами login, logout, me
 */
export function useAuthApi() {
    /**
     * Аутентифицирует пользователя по логину и паролю.
     * При успехе бэкенд устанавливает session cookie, и последующие запросы
     * автоматически становятся авторизованными за счёт credentials: 'include'.
     *
     * @param payload логин и пароль пользователя
     * @returns данные авторизованного пользователя (id, role и т.п.)
     * @throws ApiError со статусом 401 при неверных учётных данных,
     *         либо ApiError со статусом 0 при сетевой ошибке
     */
    async function login(payload: AuthLoginRequest): Promise<AuthUser> {
        return apiPost<AuthUser, AuthLoginRequest>('/api/auth/login', payload)
    }

    /**
     * Завершает текущую серверную сессию.
     * 401 от /logout означает, что сессия уже истекла на стороне бэкенда -
     * с точки зрения пользователя это не ошибка, поэтому такая ситуация
     * игнорируется. Все остальные ошибки пробрасываются наверх.
     *
     * @throws ApiError при любой ошибке, кроме истёкшей сессии (401)
     */
    async function logout(): Promise<void> {
        try {
            await apiPost<{ success: boolean }>('/api/auth/logout')
        } catch (err: unknown) {
            if (isApiError(err) && err.status === HTTP_STATUS_UNAUTHORIZED) {
                return
            }
            throw err
        }
    }

    /**
     * Запрашивает данные текущего авторизованного пользователя с бэкенда.
     * Используется для восстановления сессии при загрузке приложения и для
     * проверки актуальности роли/прав после повторного входа.
     *
     * @returns данные авторизованного пользователя
     * @throws ApiError со статусом 401, если кука сессии отсутствует или невалидна
     */
    async function me(): Promise<AuthUser> {
        return apiGet<AuthUser>('/api/auth/me')
    }

    return {login, logout, me}
}
