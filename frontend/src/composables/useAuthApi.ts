import { apiGet, apiPost } from '@/composables/useApi'
import type { AuthLoginRequest, AuthUser } from '@/types'

/**
 * Composable for authentication REST endpoints.
 * Does not hold login form state — callers own that.
 */
export function useAuthApi() {
    /**
     * Authenticates the user with username and password.
     * Throws ApiError on 401 or other failures.
     */
    async function login(payload: AuthLoginRequest): Promise<AuthUser> {
        return apiPost<AuthUser, AuthLoginRequest>('/api/auth/login', payload)
    }

    /**
     * Terminates the current server session.
     * Tolerates an already-expired session (404/401) without throwing.
     */
    async function logout(): Promise<void> {
        try {
            await apiPost<{ success: boolean }, Record<string, never>>('/api/auth/logout', {})
        } catch (err: unknown) {
            const isExpiredSession = typeof err === 'object'
                && err !== null
                && 'status' in err
                && (err as { status: number }).status === 401

            if (!isExpiredSession) {
                throw err
            }
        }
    }

    /**
     * Fetches the current authenticated user from the server.
     * Throws ApiError (status 401) if the session is not valid.
     */
    async function me(): Promise<AuthUser> {
        return apiGet<AuthUser>('/api/auth/me')
    }

    return { login, logout, me }
}
