import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Router } from 'vue-router'

import { useAuthApi } from '@/composables/api/useAuthApi'
import { onUnauthorized } from '@/composables/shared/authBus'
import { HTTP_STATUS_UNAUTHORIZED } from '@/constants/http'
import { ROUTES } from '@/constants/routes'
import { useUserProfileStore } from '@/stores/userProfile'
import type { ApiError, AuthLoginRequest, AuthUser } from '@/types'
import { isApiError } from '@/utils/typeGuards'

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

interface PersistedAuthHint {
    isAuthenticated: boolean
    username: string
}

const STORAGE_KEY = 'medmentor-auth-gate'

function readPersistedHint(): PersistedAuthHint {
    if (typeof window === 'undefined') {
        return { isAuthenticated: false, username: '' }
    }

    const raw = window.sessionStorage.getItem(STORAGE_KEY)

    if (!raw) {
        return { isAuthenticated: false, username: '' }
    }

    try {
        const parsed = JSON.parse(raw) as Partial<PersistedAuthHint>

        return {
            isAuthenticated: parsed.isAuthenticated === true,
            username: typeof parsed.username === 'string' ? parsed.username : '',
        }
    } catch {
        return { isAuthenticated: false, username: '' }
    }
}

function persistHint(hint: PersistedAuthHint): void {
    if (typeof window === 'undefined') {
        return
    }

    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(hint))
}

// ---------------------------------------------------------------------------
// Router reference
// ---------------------------------------------------------------------------

/**
 * Vue Router instance shared with the store for programmatic navigation
 * during session invalidation. Must be registered from main.ts after
 * app.use(router) to avoid circular imports with router/guards/auth.ts.
 */
let _router: Router | null = null

export function registerRouter(router: Router): void {
    _router = router
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BootstrapStatus = 'idle' | 'pending' | 'ready' | 'error'

export type BootstrapResult =
    | { ok: true }
    | { ok: false; reason: 'unauthenticated' | 'network' | 'server' }

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthGateStore = defineStore('authGate', () => {
    const hint = readPersistedHint()

    // Core auth state
    const user = ref<AuthUser | null>(null)
    const isAuthenticated = ref(hint.isAuthenticated)

    // Bootstrap lifecycle
    const bootstrapStatus = ref<BootstrapStatus>('idle')
    const bootstrapError = ref<ApiError | null>(null)

    // Pending flags
    const isLoginPending = ref(false)
    const isLogoutPending = ref(false)

    // UI state
    const isAuthModalOpen = ref(false)
    const redirectTarget = ref<string | null>(null)

    /** In-flight /me promise shared across concurrent guard activations. */
    let bootstrapPromise: Promise<BootstrapResult> | null = null

    // Derived state
    const isBootstrapped = computed(() => bootstrapStatus.value === 'ready')
    const displayName = computed(() => user.value?.displayName ?? user.value?.username ?? 'Resident')
    const username = computed(() => user.value?.username ?? '')

    // -----------------------------------------------------------------------
    // Internal session mutations
    // -----------------------------------------------------------------------

    function _applySignIn(authUser: AuthUser): void {
        user.value = authUser
        isAuthenticated.value = true
        bootstrapStatus.value = 'ready'
        bootstrapError.value = null
        isAuthModalOpen.value = false
        persistHint({ isAuthenticated: true, username: authUser.username })
    }

    function _clearSession(): void {
        user.value = null
        isAuthenticated.value = false
        bootstrapStatus.value = 'idle'
        bootstrapError.value = null
        bootstrapPromise = null
        persistHint({ isAuthenticated: false, username: '' })
        useUserProfileStore().reset()
    }

    // -----------------------------------------------------------------------
    // Auth modal helpers
    // -----------------------------------------------------------------------

    /**
     * Opens the auth modal for unauthenticated users.
     * Stores an optional redirect destination to use after successful login.
     */
    function openAuthModal(redirect?: string | null): void {
        if (!isAuthenticated.value) {
            isAuthModalOpen.value = true
        }

        redirectTarget.value = redirect ?? null
    }

    /** Closes the auth modal. */
    function closeAuthModal(): void {
        isAuthModalOpen.value = false
    }

    /** Explicitly sets the redirect target without opening the modal. */
    function setRedirectTarget(path: string | null): void {
        redirectTarget.value = path
    }

    /**
     * Returns the current redirect target and clears it.
     * Call after a successful login before navigating.
     */
    function consumeRedirectTarget(): string | null {
        const next = redirectTarget.value

        redirectTarget.value = null
        return next
    }

    // -----------------------------------------------------------------------
    // Public session lifecycle actions
    // -----------------------------------------------------------------------

    /**
     * Clears local auth state without calling the backend.
     * Used by global 401 handling when the server session has already expired.
     * Does not navigate — caller or global handler is responsible for routing.
     */
    function invalidateSession(): void {
        _clearSession()
        redirectTarget.value = null
        isAuthModalOpen.value = false
    }

    /**
     * Authenticates the user with username and password.
     * On success: stores the returned user, satisfies bootstrap, closes the modal.
     * On failure: throws ApiError for the caller to map into error copy.
     */
    async function login(credentials: AuthLoginRequest): Promise<void> {
        if (isLoginPending.value) {
            return
        }

        isLoginPending.value = true

        try {
            const authUser = await useAuthApi().login(credentials)
            _applySignIn(authUser)
        } finally {
            isLoginPending.value = false
        }
    }

    /**
     * Terminates the server session and clears local auth state.
     * Tolerates an already-expired server session (401/404 from logout endpoint).
     */
    async function logout(): Promise<void> {
        if (isLogoutPending.value) {
            return
        }

        isLogoutPending.value = true

        try {
            await useAuthApi().logout()
        } finally {
            isLogoutPending.value = false
            _clearSession()
            redirectTarget.value = null
            isAuthModalOpen.value = false
        }
    }

    // -----------------------------------------------------------------------
    // Auth bootstrap (called by route guard)
    // -----------------------------------------------------------------------

    /**
     * Verifies the current server session via GET /api/auth/me.
     *
     * - Valid session: marks the store as authenticated, returns { ok: true }.
     * - 401 (no session): clears auth state, returns { ok: false, reason: 'unauthenticated' }.
     * - status 0 (network): returns { ok: false, reason: 'network' }.
     * - 5xx (server error): returns { ok: false, reason: 'server' }.
     *
     * Concurrent calls share a single in-flight promise to prevent duplicate
     * requests during fast route transitions.
     */
    function bootstrap(): Promise<BootstrapResult> {
        if (bootstrapStatus.value === 'ready' && isAuthenticated.value) {
            return Promise.resolve({ ok: true })
        }

        if (bootstrapPromise) {
            return bootstrapPromise
        }

        bootstrapStatus.value = 'pending'
        bootstrapError.value = null

        const { me } = useAuthApi()

        bootstrapPromise = me()
            .then((authUser) => {
                _applySignIn(authUser)
                bootstrapPromise = null
                return { ok: true } satisfies BootstrapResult
            })
            .catch((err: unknown) => {
                bootstrapPromise = null

                const apiErr = isApiError(err) ? err : null
                const status = apiErr?.status ?? -1

                if (status === HTTP_STATUS_UNAUTHORIZED) {
                    _clearSession()
                    return { ok: false, reason: 'unauthenticated' } satisfies BootstrapResult
                }

                bootstrapStatus.value = 'error'

                if (status === 0) {
                    bootstrapError.value = { error: 'Network error during session check', status: 0 }
                    return { ok: false, reason: 'network' } satisfies BootstrapResult
                }

                bootstrapError.value = apiErr ?? { error: 'Server error during session check', status }
                return { ok: false, reason: 'server' } satisfies BootstrapResult
            })

        return bootstrapPromise
    }

    // -----------------------------------------------------------------------
    // Global 401 handler (registered at store init)
    // -----------------------------------------------------------------------

    onUnauthorized(() => {
        if (!isAuthenticated.value) {
            // Session already invalidated — nothing to do.
            return
        }

        const currentPath = _router?.currentRoute.value.fullPath ?? null

        invalidateSession()

        if (!_router) {
            return
        }

        const query: Record<string, string> = { auth: 'login' }
        const safeRedirect = currentPath && currentPath !== '/' && !currentPath.startsWith('//')

        if (safeRedirect && currentPath) {
            query.redirect = currentPath
        }

        _router.push({
            name: ROUTES.HOME,
            query,
        })
    })

    return {
        // State
        user,
        isAuthenticated,
        bootstrapStatus,
        bootstrapError,
        isLoginPending,
        isLogoutPending,
        isAuthModalOpen,
        redirectTarget,

        // Computed
        isBootstrapped,
        displayName,
        username,

        // Actions
        bootstrap,
        login,
        logout,
        invalidateSession,
        openAuthModal,
        closeAuthModal,
        setRedirectTarget,
        consumeRedirectTarget,
    }
})
