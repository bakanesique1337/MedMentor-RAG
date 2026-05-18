<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import PageTransition from '@/components/common/PageTransition.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import { ROUTES } from '@/constants/routes'
import { useUserProfileStore } from '@/stores/userProfile'

const SIDEBAR_KEY = 'mm_sidebar_collapsed'
const SIDEBAR_WIDTH_EXPANDED = '24.8rem'
const SIDEBAR_WIDTH_COLLAPSED = '6.4rem'

const route = useRoute()
const collapsed = ref(false)
const userProfile = useUserProfileStore()

/**
 * The chat view renders its own context-rich sidebar (`ChatSidebar`),
 * so the global navigation sidebar must be suppressed for that route to
 * avoid two stacked sidebars on screen.
 */
const showGlobalSidebar = computed(() => route.name !== ROUTES.CHAT)

const sidebarWidth = computed(() => (collapsed.value ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED))

const sidebarWrapperWidth = computed(() => (showGlobalSidebar.value ? sidebarWidth.value : '0px'))

onMounted(() => {
    const stored = window.localStorage.getItem(SIDEBAR_KEY)
    if (stored === '1') collapsed.value = true

    userProfile.loadSettings().catch(() => undefined)
})

function handleCollapse(value: boolean): void {
    collapsed.value = value
    window.localStorage.setItem(SIDEBAR_KEY, value ? '1' : '0')
}
</script>

<template>
    <div
        data-layout="app"
        class="flex h-screen w-screen overflow-hidden bg-surface-base"
    >
        <div
            class="shrink-0 self-stretch overflow-hidden transition-[width] duration-200 ease-out motion-reduce:transition-none"
            :style="{ width: sidebarWrapperWidth }"
            :aria-hidden="!showGlobalSidebar"
        >
            <AppSidebar
                :collapsed="collapsed"
                @update:collapsed="handleCollapse"
            />
        </div>
        <main class="relative flex min-w-0 flex-1 flex-col overflow-hidden">
            <PageTransition />
        </main>
    </div>
</template>
