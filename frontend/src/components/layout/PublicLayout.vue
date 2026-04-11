<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AuthModal from '@/components/common/AuthModal.vue'
import TheFooter from '@/components/layout/TheFooter/TheFooter.vue'
import TheHeader from '@/components/layout/TheHeader/TheHeader.vue'
import { VAlert } from '@/components/ui'
import { useAuthGateStore } from '@/stores/authGate'

const AUTH_ERROR_COPY: Record<string, string> = {
    network: 'Could not reach the server while checking your session. Check your connection and try again.',
    server: 'Server error while checking your session. Please try again in a moment.',
} as const

const route = useRoute()
const router = useRouter()
const authGate = useAuthGateStore()

const authErrorReason = computed(() => {
    const reason = route.query.authError
    return typeof reason === 'string' && reason in AUTH_ERROR_COPY ? reason : null
})

/**
 * Watches the auth and redirect query params and opens the auth modal when
 * the auth=login intent is present and the user is not authenticated.
 */
watch(
    () => [route.query.auth, route.query.redirect, authGate.isAuthenticated] as const,
    ([authIntent, redirectTarget, isAuthenticated]) => {
        if (isAuthenticated) {
            return
        }

        if (authIntent !== 'login') {
            return
        }

        authGate.openAuthModal(
            typeof redirectTarget === 'string' ? redirectTarget : null,
        )
    },
    {
        immediate: true,
    },
)

/**
 * Cleans auth-related query params from the URL after the auth modal closes.
 */
async function handleAuthModalClose(): Promise<void> {
    const hasAuthIntent = route.query.auth === 'login'
    const hasRedirect = route.query.redirect !== undefined
    const hasAuthError = route.query.authError !== undefined

    if (!hasAuthIntent && !hasRedirect && !hasAuthError) {
        return
    }

    const cleanQuery = { ...route.query }
    delete cleanQuery.auth
    delete cleanQuery.redirect
    delete cleanQuery.authError

    await router.replace({ query: cleanQuery })
}
</script>

<template>
    <div
        data-layout="public"
        class="flex min-h-screen flex-col"
    >
        <TheHeader variant="public" />

        <div
            v-if="authErrorReason"
            class="mx-auto w-full max-w-384 px-4 pt-3"
        >
            <VAlert
                status="error"
                title="Session check failed"
                :description="AUTH_ERROR_COPY[authErrorReason]"
            />
        </div>

        <main class="flex-1">
            <RouterView />
        </main>

        <TheFooter variant="public" />

        <AuthModal @close="handleAuthModalClose" />
    </div>
</template>
