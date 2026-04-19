<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ROUTES } from '@/constants/routes'
import { useAuthGateStore } from '@/stores/authGate'

interface Props {
    collapsed: boolean
}

defineProps<Props>()

const emit = defineEmits<{
    'update:collapsed': [value: boolean]
    logout: []
}>()

const route = useRoute()
const router = useRouter()
const authGate = useAuthGateStore()

const activeKey = computed(() => {
    const name = route.name
    if (name === ROUTES.CASES) return 'cases'
    if (name === ROUTES.CHAT) return 'chat'
    if (name === ROUTES.PROFILE) return 'profile'
    return 'cases'
})

const initials = computed(() => {
    const name = authGate.displayName || authGate.username || 'У'
    return name
        .split(' ')
        .slice(0, 2)
        .map((p) => p[0] ?? '')
        .join('')
        .toUpperCase() || 'У'
})

function handleToggle(): void {
    emit('update:collapsed', !Boolean(false))
}

function handleCollapse(value: boolean): void {
    emit('update:collapsed', value)
}

function navigateTo(name: string): void {
    router.push({ name }).catch(() => undefined)
}

function handleLogout(): void {
    emit('logout')
}

interface NavItem {
    key: 'home' | 'cases' | 'profile'
    label: string
    route: string
}

const NAV_ITEMS: readonly NavItem[] = [
    { key: 'cases', label: 'Библиотека кейсов', route: ROUTES.CASES },
    { key: 'profile', label: 'Профиль', route: ROUTES.PROFILE },
] as const
</script>

<template>
    <aside
        class="flex h-screen shrink-0 flex-col overflow-hidden border-r border-[color:var(--color-dark-line)] bg-[color:var(--color-dark-bg)] text-[color:var(--color-dark-ink)] transition-[width,min-width]"
        :style="{ width: collapsed ? '6.4rem' : '24.8rem', minWidth: collapsed ? '6.4rem' : '24.8rem' }"
    >
        <div
            class="flex items-center gap-[1rem] border-b border-[color:var(--color-dark-line)] px-[1.6rem] py-[1.4rem]"
            :class="collapsed ? 'justify-center px-0' : ''"
        >
            <div
                class="flex size-[3rem] shrink-0 items-center justify-center rounded-[0.7rem] font-serif text-[1.7rem] font-semibold italic text-[color:var(--color-ink)]"
                style="background: linear-gradient(135deg, var(--color-dark-teal), var(--color-teal-deep)); box-shadow: 0 0 0 1px rgb(63 185 179 / 0.35), 0 4px 12px rgb(63 185 179 / 0.2);"
            >
                M
            </div>
            <template v-if="!collapsed">
                <div class="min-w-0 flex-1">
                    <div class="text-[1.3rem] font-semibold leading-tight tracking-[-0.01em] text-[color:var(--color-dark-ink)]">
                        MedMentor
                    </div>
                    <div class="text-eyebrow-sm text-[color:var(--color-dark-teal)]">
                        RAG &middot; Clinical Sim
                    </div>
                </div>
                <button
                    type="button"
                    class="flex size-[2.4rem] items-center justify-center rounded-[0.4rem] text-[color:var(--color-dark-ink-2)] hover:text-[color:var(--color-dark-ink)]"
                    aria-label="Свернуть меню"
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
                aria-label="Развернуть меню"
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
                v-for="item in NAV_ITEMS"
                :key="item.key"
                type="button"
                class="mb-[0.4rem] flex w-full items-center gap-[1rem] rounded-[0.6rem] px-[1rem] py-[0.8rem] text-left text-[1.3rem] transition"
                :class="activeKey === item.key
                    ? 'bg-[color:rgb(63_185_179_/_0.12)] text-[color:var(--color-dark-ink)] font-medium border-l-[0.2rem] border-[color:var(--color-dark-teal)]'
                    : 'text-[color:var(--color-dark-ink-2)] hover:text-[color:var(--color-dark-ink)] border-l-[0.2rem] border-transparent'"
                @click="navigateTo(item.route)"
            >
                <span
                    class="flex w-[1.6rem] items-center justify-center"
                    :class="activeKey === item.key ? 'text-[color:var(--color-dark-teal)]' : ''"
                >
                    <svg
                        v-if="item.key === 'cases'"
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
                    <svg
                        v-else
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                    >
                        <circle
                            cx="7"
                            cy="5"
                            r="2.5"
                            stroke="currentColor"
                            stroke-width="1.1"
                        />
                        <path
                            d="M2 12c0-2.5 2.2-4 5-4s5 1.5 5 4"
                            stroke="currentColor"
                            stroke-width="1.1"
                            stroke-linecap="round"
                        />
                    </svg>
                </span>
                <span class="flex-1">{{ item.label }}</span>
            </button>
        </nav>

        <div
            v-if="!collapsed"
            class="flex items-center gap-[1rem] border-t border-[color:var(--color-dark-line)] px-[1.6rem] py-[1.2rem]"
        >
            <div
                class="flex size-[2.8rem] shrink-0 items-center justify-center rounded-full bg-[color:var(--color-dark-teal)] text-[1.1rem] font-bold text-[color:var(--color-ink)]"
            >
                {{ initials }}
            </div>
            <div class="min-w-0 flex-1">
                <div class="truncate text-[1.2rem] font-medium text-[color:var(--color-dark-ink)]">
                    {{ authGate.displayName || authGate.username || 'Студент' }}
                </div>
                <div class="truncate text-[1.05rem] text-[color:var(--color-dark-ink-2)]">
                    Студент &middot; 5 курс
                </div>
            </div>
            <button
                type="button"
                class="flex size-[2.8rem] items-center justify-center rounded-[0.6rem] text-[color:var(--color-dark-ink-2)] hover:bg-[color:rgb(234_244_243_/_0.08)] hover:text-[color:var(--color-dark-ink)]"
                aria-label="Выйти"
                :disabled="authGate.isLogoutPending"
                @click="handleLogout"
            >
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                >
                    <path
                        d="M6 2H3a1 1 0 00-1 1v8a1 1 0 001 1h3"
                        stroke="currentColor"
                        stroke-width="1.2"
                        stroke-linecap="round"
                    />
                    <path
                        d="M9 5l3 2-3 2M5.5 7H12"
                        stroke="currentColor"
                        stroke-width="1.2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
            </button>
        </div>
    </aside>
</template>
