<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppSidebar from '@/components/layout/AppSidebar.vue'
import { ROUTES } from '@/constants/routes'
import { useAuthGateStore } from '@/stores/authGate'

const SIDEBAR_KEY = 'mm_sidebar_collapsed'

const router = useRouter()
const authGate = useAuthGateStore()
const collapsed = ref(false)

onMounted(() => {
    const stored = window.localStorage.getItem(SIDEBAR_KEY)
    if (stored === '1') collapsed.value = true
})

function handleCollapse(value: boolean): void {
    collapsed.value = value
    window.localStorage.setItem(SIDEBAR_KEY, value ? '1' : '0')
}

async function handleLogout(): Promise<void> {
    await authGate.logout()
    await router.push({ name: ROUTES.HOME })
}
</script>

<template>
    <div
        data-layout="app"
        class="flex h-screen w-screen overflow-hidden bg-surface-base"
    >
        <AppSidebar
            :collapsed="collapsed"
            @update:collapsed="handleCollapse"
            @logout="handleLogout"
        />
        <main class="flex min-w-0 flex-1 flex-col overflow-hidden">
            <RouterView />
        </main>
    </div>
</template>
