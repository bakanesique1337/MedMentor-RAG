import type { NavigationGuard } from 'vue-router'

import { ROUTES } from '@/constants/routes'
import { useAuthGateStore } from '@/stores/authGate'

/**
 * Route guard attached to the AppLayout parent route.
 *
 * Bootstraps the current server session via GET /api/auth/me on every protected
 * navigation. A successful bootstrap result is cached for the app lifetime so
 * subsequent route changes within AppLayout do not trigger additional /me calls.
 *
 * Redirect behavior:
 * - 401 (unauthenticated): redirect to HOME with auth=login intent and original path.
 * - status:0 (network error): redirect to HOME with authError=network, path preserved.
 * - 5xx (server error): redirect to HOME with authError=server, path preserved.
 */
export const authGuard: NavigationGuard = async (to) => {
    const authGate = useAuthGateStore()

    const result = await authGate.bootstrap()

    if (result.ok) {
        return true
    }

    const redirect = to.fullPath === '/' ? undefined : to.fullPath
    const redirectQuery = redirect ? { redirect } : {}

    if (result.reason === 'unauthenticated') {
        return {
            name: ROUTES.HOME,
            query: {
                auth: 'login',
                ...redirectQuery,
            },
        }
    }

    // Network or server error: preserve destination but do not open auth modal
    // (P5 will handle this state with a user-visible error message)
    return {
        name: ROUTES.HOME,
        query: {
            authError: result.reason,
            ...redirectQuery,
        },
    }
}
