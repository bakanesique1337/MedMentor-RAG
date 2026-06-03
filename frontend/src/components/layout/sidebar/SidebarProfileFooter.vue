<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { avatarGradient } from '@/constants/avatar'
import { ROUTES } from '@/constants/routes'
import { useAuthGateStore } from '@/stores/authGate'
import { useUserProfileStore } from '@/stores/userProfile'

const COPY = {
    profileAriaLabel: 'Перейти в профиль',
    fallbackUserName: 'Студент',
} as const

const FALLBACK_INITIAL = 'У'

const router = useRouter()
const authGate = useAuthGateStore()
const userProfile = useUserProfileStore()

/**
 * Полное имя пользователя из стора профиля либо из authGate, если настройки
 * ещё не подгрузились.
 */
const displayLabel = computed<string>(() => {
    return (
        userProfile.displayName
        || authGate.displayName
        || authGate.username
        || COPY.fallbackUserName
    )
})

/**
 * Две первые буквы имени для аватара. Когда имя ещё не загружено, возвращаем
 * единственный fallback-символ, чтобы аватар не схлопывался по ширине.
 */
const initials = computed<string>(() => {
    const letters = displayLabel.value
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0] ?? '')
        .join('')
        .toUpperCase()
    return letters || FALLBACK_INITIAL
})

const avatarStyle = computed(() => ({
    background: avatarGradient(userProfile.avatarVariant),
}))

const subtitle = computed<string>(() => userProfile.subtitle)

function handleNavigateProfile(): void {
    router.push({ name: ROUTES.PROFILE }).catch(() => undefined)
}
</script>

<template>
    <button
        type="button"
        class="flex w-full items-center gap-4 border-t border-dark-line px-[1.6rem] py-[1.2rem] text-left transition hover:bg-[rgb(234_244_243/0.04)]"
        :aria-label="COPY.profileAriaLabel"
        @click="handleNavigateProfile"
    >
        <span
            class="flex size-[2.8rem] shrink-0 items-center justify-center rounded-full text-[1.1rem] font-bold text-white"
            :style="avatarStyle"
        >
            {{ initials }}
        </span>
        <span class="block min-w-0 flex-1">
            <span class="block truncate text-[1.2rem] font-medium text-dark-ink">
                {{ displayLabel }}
            </span>
            <span
                v-if="subtitle"
                class="block truncate text-[1.05rem] text-dark-ink-2"
            >
                {{ subtitle }}
            </span>
        </span>
    </button>
</template>