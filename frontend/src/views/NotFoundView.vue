<script setup lang="ts">
import { useRouter } from 'vue-router'

import { VButton } from '@/components/ui'
import { ROUTES } from '@/constants/routes'

const router = useRouter()
</script>

<template>
    <div class="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div class="flex flex-col items-center gap-4 text-center">
            <p class="text-[8rem] font-bold leading-none text-text-tertiary">
                404
            </p>
            <h1 class="text-h2 font-semibold text-text-primary">
                Page not found
            </h1>
            <p class="max-w-[40rem] text-body text-text-secondary">
                The page you are looking for does not exist or has been moved.
            </p>
            <VButton
                class="mt-2"
                @click="router.push({ name: ROUTES.HOME })"
            >
                Back to home
            </VButton>
        </div>
    </div>
</template>
