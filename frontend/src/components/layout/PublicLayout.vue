<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AuthModal from '@/components/common/AuthModal.vue'
import TheFooter from '@/components/layout/TheFooter/TheFooter.vue'
import TheHeader from '@/components/layout/TheHeader/TheHeader.vue'
import { useAuthGateStore } from '@/stores/authGate'

const AUTH_ERROR_COPY: Record<string, string> = {
    network: 'Не удалось связаться с сервером при проверке сессии. Проверьте соединение и попробуйте снова.',
    server: 'Ошибка сервера при проверке сессии. Повторите попытку через несколько секунд.',
} as const

const route = useRoute()
const router = useRouter()
const authGate = useAuthGateStore()

const authErrorReason = computed(() => {
    const reason = route.query.authError
    return typeof reason === 'string' && reason in AUTH_ERROR_COPY ? reason : null
})

watch(
    () => [route.query.auth, route.query.redirect, authGate.isAuthenticated] as const,
    ([authIntent, redirectTarget, isAuthenticated]) => {
        if (isAuthenticated) return
        if (authIntent !== 'login') return
        authGate.openAuthModal(
            typeof redirectTarget === 'string' ? redirectTarget : null,
        )
    },
    { immediate: true },
)

/**
 * Cleans auth-related query params from the URL after the auth modal closes.
 */
async function handleAuthModalClose(): Promise<void> {
    const hasAuthIntent = route.query.auth === 'login'
    const hasRedirect = route.query.redirect !== undefined
    const hasAuthError = route.query.authError !== undefined

    if (!hasAuthIntent && !hasRedirect && !hasAuthError) return

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
        class="flex min-h-screen flex-col bg-surface-base"
    >
        <TheHeader variant="public" />

        <div
            v-if="authErrorReason"
            class="mx-auto w-full max-w-[124rem] px-[3.2rem] pt-[1.2rem]"
        >
            <div class="rounded-[1rem] border border-[color:rgb(138_46_32_/_0.3)] bg-[color:var(--color-rose-soft)] px-[1.6rem] py-[1.2rem] text-[1.3rem] text-[color:var(--color-rose-text)]">
                <p class="font-semibold">Проверка сессии не удалась</p>
                <p class="mt-[0.4rem]">{{ AUTH_ERROR_COPY[authErrorReason] }}</p>
            </div>
        </div>

        <main class="flex-1">
            <RouterView />
        </main>

        <TheFooter variant="public" />

        <AuthModal @close="handleAuthModalClose" />
    </div>
</template>
