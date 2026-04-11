<script setup lang="ts">
import { useRouter } from 'vue-router'

import { VButton } from '@/components/ui'
import { ROUTES } from '@/constants/routes'
import { useAuthGateStore } from '@/stores/authGate'

const router = useRouter()
const authGate = useAuthGateStore()
</script>

<template>
    <div class="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div class="flex flex-col items-center gap-4 text-center">
            <p class="text-[8rem] font-bold leading-none text-text-tertiary">404</p>
            <h1 class="text-h2 font-semibold text-text-primary">Page not found</h1>
            <p class="max-w-[40rem] text-body text-text-secondary">
                The page you are looking for does not exist or has been moved.
            </p>
            <div class="mt-2 flex flex-wrap justify-center gap-3">
                <VButton
                    variant="secondary"
                    @click="router.push({ name: ROUTES.HOME })"
                >
                    Go to home
                </VButton>
                <VButton
                    v-if="authGate.isAuthenticated"
                    @click="router.push({ name: ROUTES.CASES })"
                >
                    Browse cases
                </VButton>
            </div>
        </div>
    </div>
</template>
