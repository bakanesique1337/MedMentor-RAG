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
    if (route.query.auth !== 'login' && route.query.redirect === undefined) {
        return
    }

    const queryWithoutAuthIntent = { ...route.query }
    delete queryWithoutAuthIntent.auth
    delete queryWithoutAuthIntent.redirect

    await router.replace({
        query: queryWithoutAuthIntent,
    })
}
</script>

<template>
    <div data-layout="public">
        <RouterView />
        <AuthModal @close="handleAuthModalClose" />
    </div>
</template>
