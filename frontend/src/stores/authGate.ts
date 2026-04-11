import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { useAuthApi } from '@/composables/useAuthApi'
import type { AuthUser } from '@/types'

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

interface PersistedAuthGateState {
    isAuthenticated: boolean
    username: string
}

const STORAGE_KEY = 'medmentor-auth-gate'

function readPersistedState(): PersistedAuthGateState {
    if (typeof window === 'undefined') {
        return { isAuthenticated: false, username: '' }
    }

    const rawState = window.sessionStorage.getItem(STORAGE_KEY)

    if (!rawState) {
        return { isAuthenticated: false, username: '' }
    }

    try {
        const parsedState = JSON.parse(rawState) as Partial<PersistedAuthGateState>

        return {
            isAuthenticated: parsedState.isAuthenticated === true,
            username: typeof parsedState.username === 'string' ? parsedState.username : '',
        }
    } catch {
        return { isAuthenticated: false, username: '' }
    }
}

function persistState(state: PersistedAuthGateState): void {
    if (typeof window === 'undefined') {
        return
    }

    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export type BootstrapResult =
    | { ok: true }
    | { ok: false; reason: 'unauthenticated' | 'network' | 'server' }

export const useAuthGateStore = defineStore('authGate', () => {
    const persisted = readPersistedState()

    const isAuthenticated = ref(persisted.isAuthenticated)
    const username = ref(persisted.username)
    const isAuthModalOpen = ref(false)
    const redirectTarget = ref<string | null>(null)

    /** True once a successful /me has been confirmed in this app lifetime. */
    const isBootstrapped = ref(false)

    /** In-flight /me promise shared across concurrent guard activations. */
    let bootstrapPromise: Promise<BootstrapResult> | null = null

    const displayName = computed(() => username.value || 'Resident')

    // -----------------------------------------------------------------------
    // Auth modal helpers
    // -----------------------------------------------------------------------

    function openAuthModal(redirect?: string | null): void {
        if (!isAuthenticated.value) {
            isAuthModalOpen.value = true
        }

        redirectTarget.value = redirect ?? null
    }

    function closeAuthModal(): void {
        isAuthModalOpen.value = false
    }

    function consumeRedirectTarget(): string | null {
        const next = redirectTarget.value

        redirectTarget.value = null
        return next
    }

    // -----------------------------------------------------------------------
    // Session lifecycle
    // -----------------------------------------------------------------------

    function signIn(user: AuthUser): void {
        isAuthenticated.value = true
        isBootstrapped.value = true
        username.value = user.username
        isAuthModalOpen.value = false

        persistState({ isAuthenticated: true, username: user.username })
    }

    function signOut(): void {
        isAuthenticated.value = false
        isBootstrapped.value = false
        username.value = ''
        isAuthModalOpen.value = false
        redirectTarget.value = null
        bootstrapPromise = null

        persistState({ isAuthenticated: false, username: '' })
    }

    // -----------------------------------------------------------------------
    // Auth bootstrap (called by route guard)
    // -----------------------------------------------------------------------

    /**
     * Verifies the current server session via GET /api/auth/me.
     *
     * - If the session is valid, marks the store as authenticated and returns { ok: true }.
     * - If the session is missing (401), clears auth state and returns { ok: false, reason: 'unauthenticated' }.
     * - If the request failed due to a network issue (status: 0), returns { ok: false, reason: 'network' }.
     * - If the server returned 5xx, returns { ok: false, reason: 'server' }.
     *
     * Concurrent calls share a single in-flight promise to prevent duplicate requests
     * during fast route transitions. The promise is cleared after bootstrap completes.
     */
    function bootstrap(): Promise<BootstrapResult> {
        if (isBootstrapped.value && isAuthenticated.value) {
            return Promise.resolve({ ok: true })
        }

        if (bootstrapPromise) {
            return bootstrapPromise
        }

        const { me } = useAuthApi()

        bootstrapPromise = me()
            .then((user) => {
                signIn(user)
                bootstrapPromise = null
                return { ok: true } satisfies BootstrapResult
            })
            .catch((err: unknown) => {
                bootstrapPromise = null

                const status = typeof err === 'object' && err !== null && 'status' in err
                    ? (err as { status: number }).status
                    : -1

                if (status === 401) {
                    signOut()
                    return { ok: false, reason: 'unauthenticated' } satisfies BootstrapResult
                }

                if (status === 0) {
                    return { ok: false, reason: 'network' } satisfies BootstrapResult
                }

                return { ok: false, reason: 'server' } satisfies BootstrapResult
            })

        return bootstrapPromise
    }

    return {
        closeAuthModal,
        consumeRedirectTarget,
        displayName,
        isAuthenticated,
        isAuthModalOpen,
        isBootstrapped,
        openAuthModal,
        redirectTarget,
        signIn,
        signOut,
        username,
        bootstrap,
    }
})
