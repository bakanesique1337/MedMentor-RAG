<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { VAvatar, VButton, VDropdown } from '@/components/ui'
import { ROUTES } from '@/constants/routes'
import { useAuthGateStore } from '@/stores/authGate'

export type HeaderVariant = 'public' | 'app' | 'error'

interface Props {
    variant: HeaderVariant
}

defineProps<Props>()

const route = useRoute()
const router = useRouter()
const authGate = useAuthGateStore()

const userMenuOpen = ref(false)

/**
 * Handles the public header CTA click.
 * Routes authenticated users to cases; opens auth modal for guests.
 */
function handlePublicCta(): void {
    if (authGate.isAuthenticated) {
        router.push({ name: ROUTES.CASES })
        return
    }
    authGate.openAuthModal()
}

/**
 * Logs out the current user and redirects to the home page.
 */
async function handleLogout(): Promise<void> {
    userMenuOpen.value = false
    await authGate.logout()
    await router.push({ name: ROUTES.HOME })
}
</script>

<template>
    <header
        :class="[
            'sticky top-0 z-sticky border-b bg-surface-base/95 backdrop-blur-sm',
            variant === 'error' ? 'border-border-subtle/50' : 'border-border-subtle',
        ]"
    >
        <div class="mx-auto flex h-[6.4rem] w-full max-w-384 items-center justify-between px-4">
            <!-- Brand -->
            <RouterLink
                :to="{ name: ROUTES.HOME }"
                class="flex items-center gap-2 text-body-sm font-semibold text-text-primary"
                aria-label="MedMentor home"
            >
                <span
                    class="inline-flex size-[3.2rem] items-center justify-center rounded-lg bg-interactive-primary-default text-label font-bold text-text-inverse"
                    aria-hidden="true"
                >
                    M
                </span>
                <span>MedMentor</span>
            </RouterLink>

            <!-- App navigation links -->
            <nav
                v-if="variant === 'app'"
                class="flex items-center gap-1"
                aria-label="Main navigation"
            >
                <RouterLink
                    :to="{ name: ROUTES.CASES }"
                    :aria-current="route.name === ROUTES.CASES ? 'page' : undefined"
                    :class="[
                        'rounded-lg px-3 py-[0.6rem] text-body-sm font-medium transition-colors',
                        route.name === ROUTES.CASES
                            ? 'bg-interactive-ghost-active text-text-primary'
                            : 'text-text-secondary hover:bg-interactive-ghost-hover hover:text-text-primary',
                    ]"
                >
                    Cases
                </RouterLink>

                <RouterLink
                    :to="{ name: ROUTES.PROFILE }"
                    :aria-current="route.name === ROUTES.PROFILE ? 'page' : undefined"
                    :class="[
                        'rounded-lg px-3 py-[0.6rem] text-body-sm font-medium transition-colors',
                        route.name === ROUTES.PROFILE
                            ? 'bg-interactive-ghost-active text-text-primary'
                            : 'text-text-secondary hover:bg-interactive-ghost-hover hover:text-text-primary',
                    ]"
                >
                    Profile
                </RouterLink>
            </nav>

            <!-- Public CTA -->
            <div v-if="variant === 'public'">
                <VButton
                    size="sm"
                    @click="handlePublicCta"
                >
                    {{ authGate.isAuthenticated ? 'Open Cases' : 'Sign in' }}
                </VButton>
            </div>

            <!-- App user menu -->
            <div v-if="variant === 'app'">
                <VDropdown
                    v-model="userMenuOpen"
                    align="end"
                    width="sm"
                    :close-on-select="false"
                >
                    <template #trigger>
                        <VAvatar
                            :name="authGate.displayName"
                            size="sm"
                        />
                    </template>

                    <div class="p-1">
                        <div class="px-2 pb-2 pt-1">
                            <p class="max-w-[18rem] truncate text-body-sm font-semibold text-text-primary">
                                {{ authGate.displayName }}
                            </p>
                            <p
                                v-if="authGate.username && authGate.username !== authGate.displayName"
                                class="max-w-[18rem] truncate text-label text-text-secondary"
                            >
                                {{ authGate.username }}
                            </p>
                        </div>
                        <div class="my-1 border-t border-border-subtle" />
                        <button
                            class="w-full rounded-lg px-2 py-[0.6rem] text-left text-body-sm text-error-text transition-colors hover:bg-error-surface disabled:pointer-events-none disabled:opacity-50"
                            :disabled="authGate.isLogoutPending"
                            @click="handleLogout"
                        >
                            {{ authGate.isLogoutPending ? 'Signing out...' : 'Sign out' }}
                        </button>
                    </div>
                </VDropdown>
            </div>

            <!-- Error layout: back to home -->
            <div v-if="variant === 'error'">
                <VButton
                    size="sm"
                    variant="ghost"
                    @click="router.push({ name: ROUTES.HOME })"
                >
                    Back to home
                </VButton>
            </div>
        </div>
    </header>
</template>
