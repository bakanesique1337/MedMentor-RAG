<script setup lang="ts">
import {computed, onMounted, watch} from 'vue'
import {useRoute, useRouter} from 'vue-router'

import VCasesIcon from '@/components/icons/VCasesIcon.vue'
import VPlayIcon from '@/components/icons/VPlayIcon.vue'
import SidebarBrandHeader from '@/components/layout/sidebar/SidebarBrandHeader.vue'
import SidebarNavButton from '@/components/layout/sidebar/SidebarNavButton.vue'
import SidebarProfileFooter from '@/components/layout/sidebar/SidebarProfileFooter.vue'
import {ROUTES} from '@/constants/routes'
import {useSidebarStore} from '@/stores/sidebar'

const LABELS = {
    casesNav: 'Все задачи',
    activeSimulationNav: 'Активная симуляция',
} as const

interface Props {
    collapsed: boolean
}

defineProps<Props>()

const emit = defineEmits<{
    'update:collapsed': [value: boolean]
}>()

const route = useRoute()
const router = useRouter()
const sidebar = useSidebarStore()

const activeKey = computed<'cases' | 'active' | 'none'>(() => {
    const name = route.name
    if (name === ROUTES.CASES) return 'cases'
    if (name === ROUTES.CHAT) return 'active'
    return 'none'
})

function handleCollapse(value: boolean): void {
    emit('update:collapsed', value)
}

function navigateToCases(): void {
    router.push({name: ROUTES.CASES}).catch(() => undefined)
}

function navigateToActive(): void {
    const session = sidebar.activeSession
    if (!session) return
    router.push({name: ROUTES.CHAT, params: {sessionId: String(session.id)}}).catch(() => undefined)
}

onMounted(() => {
    Promise.all([sidebar.fetchCasesCount(), sidebar.fetchActiveSession()])
})

watch(() => route.name, (newName, oldName) => {
    if (newName === oldName) return
    sidebar.fetchActiveSession()
})
</script>

<template>
    <aside
        class="flex h-screen shrink-0 flex-col overflow-hidden border-r border-dark-line bg-dark-bg text-dark-ink transition-[width,min-width] duration-200 ease-out motion-reduce:transition-none"
        :style="{ width: collapsed ? '6.4rem' : '24.8rem', minWidth: collapsed ? '6.4rem' : '24.8rem' }"
    >
        <SidebarBrandHeader
            collapsible
            :collapsed="collapsed"
            @update:collapsed="handleCollapse"
        />

        <nav
            v-if="!collapsed"
            class="flex-1 overflow-y-auto px-4 py-[1.2rem]"
        >
            <SidebarNavButton
                :label="LABELS.casesNav"
                :active="activeKey === 'cases'"
                :badge="sidebar.casesCount"
                class="mb-[0.4rem]"
                @click="navigateToCases"
            >
                <template #icon>
                    <VCasesIcon/>
                </template>
            </SidebarNavButton>

            <SidebarNavButton
                v-if="sidebar.activeSession !== null"
                :label="LABELS.activeSimulationNav"
                :active="activeKey === 'active'"
                class="mb-[0.4rem]"
                @click="navigateToActive"
            >
                <template #icon>
                    <VPlayIcon/>
                </template>
            </SidebarNavButton>
        </nav>

        <SidebarProfileFooter v-if="!collapsed"/>
    </aside>
</template>
