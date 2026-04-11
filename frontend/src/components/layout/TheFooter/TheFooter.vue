<script setup lang="ts">
import { computed } from 'vue'

import { ROUTES } from '@/constants/routes'
import { useAuthGateStore } from '@/stores/authGate'

export type FooterVariant = 'public' | 'app'

interface Props {
    variant: FooterVariant
}

defineProps<Props>()

const authGate = useAuthGateStore()

const currentYear = computed(() => new Date().getFullYear())

/**
 * Handles the footer sign-in CTA, opening the auth modal for guests.
 */
function handleSignIn(): void {
    authGate.openAuthModal()
}
</script>

<template>
    <!-- Public footer: informational, product-oriented -->
    <footer
        v-if="variant === 'public'"
        class="border-t border-border-subtle bg-surface-sunken"
    >
        <div class="mx-auto w-full max-w-384 px-4 py-8">
            <div class="grid gap-8 sm:grid-cols-3">
                <!-- Brand column -->
                <div class="flex flex-col gap-3">
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

                    <p class="max-w-[28rem] text-body-sm text-text-secondary">
                        AI-powered clinical training simulator. Every response is grounded
                        in structured clinical evidence through retrieval-augmented generation.
                    </p>
                </div>

                <!-- Product column -->
                <div class="flex flex-col gap-3">
                    <p class="text-label font-semibold uppercase tracking-wide text-text-tertiary">
                        Product
                    </p>
                    <nav
                        class="flex flex-col gap-2"
                        aria-label="Footer navigation"
                    >
                        <button
                            v-if="!authGate.isAuthenticated"
                            class="w-fit text-left text-body-sm text-text-secondary transition-colors hover:text-text-primary"
                            @click="handleSignIn"
                        >
                            Sign in
                        </button>
                        <RouterLink
                            v-else
                            :to="{ name: ROUTES.CASES }"
                            class="w-fit text-body-sm text-text-secondary transition-colors hover:text-text-primary"
                        >
                            Cases
                        </RouterLink>
                    </nav>
                </div>

                <!-- About column -->
                <div class="flex flex-col gap-3">
                    <p class="text-label font-semibold uppercase tracking-wide text-text-tertiary">
                        About
                    </p>
                    <p class="max-w-[28rem] text-body-sm text-text-secondary">
                        Designed for medical students and continuing medical education.
                        Practice history taking, clinical reasoning, and diagnostic
                        hypothesis building with virtual patients.
                    </p>
                </div>
            </div>

            <!-- Bottom bar -->
            <div class="mt-8 border-t border-border-subtle pt-6">
                <p class="text-label text-text-tertiary">
                    &copy; {{ currentYear }} MedMentor. All rights reserved.
                </p>
            </div>
        </div>
    </footer>

    <!-- App footer: compact, low noise -->
    <footer
        v-else
        class="border-t border-border-subtle"
    >
        <div class="mx-auto flex h-[4.8rem] w-full max-w-384 items-center justify-between px-4">
            <RouterLink
                :to="{ name: ROUTES.HOME }"
                class="text-label text-text-tertiary transition-colors hover:text-text-secondary"
                aria-label="MedMentor home"
            >
                MedMentor
            </RouterLink>
            <p class="text-label text-text-tertiary">
                &copy; {{ currentYear }}
            </p>
        </div>
    </footer>
</template>
