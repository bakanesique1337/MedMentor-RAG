<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ROUTES } from '@/constants/routes'
import { useAuthGateStore } from '@/stores/authGate'
import { useSidebarStore } from '@/stores/sidebar'

const COPY = {
    brandLogoAlt: 'MedMentor RAG',
    brandWordmark: 'MedMentor',
    brandSubtitle: 'RAG · Clinical Sim',
    collapseAriaLabel: 'Свернуть меню',
    expandAriaLabel: 'Развернуть меню',
    casesNav: 'Все кейсы',
    activeSimulationNav: 'Активная симуляция',
    profileAriaLabel: 'Перейти в профиль',
    fallbackUserName: 'Студент',
    userSubtitle: 'Студент · 5 курс, леч. фак.',
} as const

const FALLBACK_USER_INITIAL = 'У'

interface Props {
    collapsed: boolean
}

defineProps<Props>()

const emit = defineEmits<{
    'update:collapsed': [value: boolean]
}>()

const route = useRoute()
const router = useRouter()
const authGate = useAuthGateStore()
const sidebar = useSidebarStore()

const activeKey = computed<'cases' | 'active' | 'none'>(() => {
    const name = route.name
    if (name === ROUTES.CASES) return 'cases'
    if (name === ROUTES.CHAT) return 'active'
    return 'none'
})

const initials = computed(() => {
    const name = authGate.displayName || authGate.username || FALLBACK_USER_INITIAL
    return name
        .split(' ')
        .slice(0, 2)
        .map((p) => p[0] ?? '')
        .join('')
        .toUpperCase() || FALLBACK_USER_INITIAL
})

function handleCollapse(value: boolean): void {
    emit('update:collapsed', value)
}

function navigateToCases(): void {
    router.push({ name: ROUTES.CASES }).catch(() => undefined)
}

function navigateToActive(): void {
    const session = sidebar.activeSession
    if (!session) return
    router.push({ name: ROUTES.CHAT, params: { sessionId: String(session.id) } }).catch(() => undefined)
}

function navigateToProfile(): void {
    router.push({ name: ROUTES.PROFILE }).catch(() => undefined)
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
        class="flex h-screen shrink-0 flex-col overflow-hidden border-r border-[color:var(--color-dark-line)] bg-[color:var(--color-dark-bg)] text-[color:var(--color-dark-ink)] transition-[width,min-width] duration-200 ease-out motion-reduce:transition-none"
        :style="{ width: collapsed ? '6.4rem' : '24.8rem', minWidth: collapsed ? '6.4rem' : '24.8rem' }"
    >
        <div
            class="flex items-center gap-[1rem] border-b border-[color:var(--color-dark-line)] px-[1.6rem] py-[1.4rem]"
            :class="collapsed ? 'justify-center px-0' : ''"
        >
            <div
                class="flex size-[3.2rem] shrink-0 items-center justify-center overflow-hidden rounded-[0.7rem]"
                style="background: linear-gradient(135deg, var(--color-dark-teal), var(--color-teal-deep)); box-shadow: 0 0 0 1px rgb(63 185 179 / 35%), 0 4px 12px rgb(63 185 179 / 20%);"
            >
                <!-- Источник 64px используется на 32px отображении: 1x браузеры
                     даунсемплят, на 2x retina-экранах пиксели идеально совпадают. -->
                <img
                    src="/MM1_64.png"
                    :alt="COPY.brandLogoAlt"
                    width="32"
                    height="32"
                    class="size-[3.2rem] object-contain"
                >
            </div>
            <template v-if="!collapsed">
                <div class="min-w-0 flex-1">
                    <div class="text-[1.3rem] font-semibold leading-tight tracking-[-0.01em] text-[color:var(--color-dark-ink)]">
                        {{ COPY.brandWordmark }}
                    </div>
                    <div class="text-eyebrow-sm text-[color:var(--color-dark-teal)]">
                        {{ COPY.brandSubtitle }}
                    </div>
                </div>
                <button
                    type="button"
                    class="flex size-[2.4rem] items-center justify-center rounded-[0.4rem] text-[color:var(--color-dark-ink-2)] hover:text-[color:var(--color-dark-ink)]"
                    :aria-label="COPY.collapseAriaLabel"
                    @click="handleCollapse(true)"
                >
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                    ><path
                        d="M9 3L5 7l4 4"
                        stroke="currentColor"
                        stroke-width="1.4"
                        fill="none"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    /></svg>
                </button>
            </template>
        </div>

        <div
            v-if="collapsed"
            class="flex flex-col items-center gap-[0.6rem] py-[1.2rem]"
        >
            <button
                type="button"
                class="flex size-[3.2rem] items-center justify-center rounded-[0.6rem] text-[color:var(--color-dark-ink-2)] hover:bg-[color:rgb(63_185_179_/_0.12)] hover:text-[color:var(--color-dark-ink)]"
                :aria-label="COPY.expandAriaLabel"
                @click="handleCollapse(false)"
            >
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                ><path
                    d="M5 3l4 4-4 4"
                    stroke="currentColor"
                    stroke-width="1.4"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                /></svg>
            </button>
        </div>

        <nav
            v-if="!collapsed"
            class="flex-1 overflow-y-auto px-[1rem] py-[1.2rem]"
        >
            <button
                type="button"
                class="mb-[0.4rem] flex w-full items-center gap-[1rem] rounded-[0.6rem] px-[1rem] py-[0.8rem] text-left text-[1.3rem] transition"
                :class="activeKey === 'cases'
                    ? 'bg-[color:rgb(63_185_179_/_0.12)] text-[color:var(--color-dark-ink)] font-medium border-l-[0.2rem] border-[color:var(--color-dark-teal)]'
                    : 'text-[color:var(--color-dark-ink-2)] hover:text-[color:var(--color-dark-ink)] border-l-[0.2rem] border-transparent'"
                @click="navigateToCases"
            >
                <span
                    class="flex w-[1.6rem] items-center justify-center"
                    :class="activeKey === 'cases' ? 'text-[color:var(--color-dark-teal)]' : ''"
                >
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                    >
                        <rect
                            x="1.5"
                            y="2.5"
                            width="11"
                            height="9"
                            rx="1.5"
                            stroke="currentColor"
                            stroke-width="1.1"
                        />
                        <path
                            d="M4 5.5h6M4 8h4"
                            stroke="currentColor"
                            stroke-width="1.1"
                            stroke-linecap="round"
                        />
                    </svg>
                </span>
                <span class="flex-1">{{ COPY.casesNav }}</span>
                <span
                    v-if="sidebar.casesCount !== null"
                    class="font-mono text-[1.05rem] tabular text-[color:var(--color-dark-ink-3)]"
                >
                    {{ sidebar.casesCount }}
                </span>
            </button>

            <button
                v-if="sidebar.activeSession !== null"
                type="button"
                class="mb-[0.4rem] flex w-full items-center gap-[1rem] rounded-[0.6rem] px-[1rem] py-[0.8rem] text-left text-[1.3rem] transition"
                :class="activeKey === 'active'
                    ? 'bg-[color:rgb(63_185_179_/_0.12)] text-[color:var(--color-dark-ink)] font-medium border-l-[0.2rem] border-[color:var(--color-dark-teal)]'
                    : 'text-[color:var(--color-dark-ink-2)] hover:text-[color:var(--color-dark-ink)] border-l-[0.2rem] border-transparent'"
                @click="navigateToActive"
            >
                <span
                    class="flex w-[1.6rem] items-center justify-center"
                    :class="activeKey === 'active' ? 'text-[color:var(--color-dark-teal)]' : ''"
                >
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                    >
                        <path
                            d="M4.5 3.5L10 7L4.5 10.5V3.5Z"
                            stroke="currentColor"
                            stroke-width="1.1"
                            stroke-linejoin="round"
                            fill="currentColor"
                            fill-opacity="0.15"
                        />
                    </svg>
                </span>
                <span class="flex-1">{{ COPY.activeSimulationNav }}</span>
            </button>
        </nav>

        <button
            v-if="!collapsed"
            type="button"
            class="flex w-full items-center gap-[1rem] border-t border-[color:var(--color-dark-line)] px-[1.6rem] py-[1.2rem] text-left transition hover:bg-[color:rgb(234_244_243_/_0.04)]"
            :aria-label="COPY.profileAriaLabel"
            @click="navigateToProfile"
        >
            <div
                class="flex size-[2.8rem] shrink-0 items-center justify-center rounded-full bg-[color:var(--color-dark-teal)] text-[1.1rem] font-bold text-[color:var(--color-ink)]"
            >
                {{ initials }}
            </div>
            <div class="min-w-0 flex-1">
                <div class="truncate text-[1.2rem] font-medium text-[color:var(--color-dark-ink)]">
                    {{ authGate.displayName || authGate.username || COPY.fallbackUserName }}
                </div>
                <div class="truncate text-[1.05rem] text-[color:var(--color-dark-ink-2)]">
                    {{ COPY.userSubtitle }}
                </div>
            </div>
        </button>
    </aside>
</template>
