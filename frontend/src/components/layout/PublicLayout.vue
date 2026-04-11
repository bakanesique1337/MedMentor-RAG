<script setup lang="ts">
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AuthModal from '@/components/common/AuthModal.vue'
import { useAuthGateStore } from '@/stores/authGate'

const route = useRoute()
const router = useRouter()
const authGate = useAuthGateStore()

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
    <div data-layout="public">
        <RouterView />
        <AuthModal @close="handleAuthModalClose" />
    </div>
</template>
