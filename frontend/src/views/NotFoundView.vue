<script setup lang="ts">
import { useRouter } from 'vue-router'

import { VButton } from '@/components/ui'
import { ROUTES } from '@/constants/routes'
import { useAuthGateStore } from '@/stores/authGate'

const router = useRouter()
const authGate = useAuthGateStore()

function handleHome(): void {
    router.push({ name: ROUTES.HOME }).catch(() => undefined)
}

function handleCases(): void {
    router.push({ name: ROUTES.CASES }).catch(() => undefined)
}
</script>

<template>
    <div class="flex flex-1 flex-col items-center justify-center px-[1.6rem] py-[6.4rem]">
        <div class="flex flex-col items-center gap-[1.6rem] text-center">
            <p class="font-serif text-[12rem] font-medium leading-none tracking-[-0.04em] text-text-tertiary">
                404
            </p>
            <h1 class="font-serif text-[3.2rem] font-medium leading-[1.1] tracking-[-0.02em] text-text-primary">
                Страница не найдена
            </h1>
            <p class="max-w-[48rem] text-[1.5rem] text-text-secondary">
                Запрашиваемая страница не существует или была перемещена.
            </p>
            <div class="mt-[0.8rem] flex flex-wrap justify-center gap-[1.2rem]">
                <VButton
                    variant="secondary"
                    @click="handleHome"
                >
                    На главную
                </VButton>
                <VButton
                    v-if="authGate.isAuthenticated"
                    @click="handleCases"
                >
                    К кейсам
                </VButton>
            </div>
        </div>
    </div>
</template>
