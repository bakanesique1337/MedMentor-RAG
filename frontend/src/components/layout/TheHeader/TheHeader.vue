<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import BrandLogo from '@/components/common/BrandLogo.vue'
import MmArrow from '@/components/common/MmArrow.vue'
import { ROUTES } from '@/constants/routes'
import { useAuthGateStore } from '@/stores/authGate'

const COPY = {
    homeAriaLabel: 'MedMentor home',
    navAriaLabel: 'Main',
    ctaAuthenticated: 'Начать кейс',
    ctaUnauthenticated: 'Войти',
    backHome: 'На главную',
} as const

export type HeaderVariant = 'public' | 'app' | 'error'

interface Props {
    variant: HeaderVariant
}

defineProps<Props>()

const router = useRouter()
const authGate = useAuthGateStore()

const scrolled = ref(false)

function handleScroll(): void {
    scrolled.value = window.scrollY > 10
}

onMounted(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
})

onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
})

/**
 * Handles the public header CTA click.
 */
function handlePublicCta(): void {
    if (authGate.isAuthenticated) {
        router.push({ name: ROUTES.CASES }).catch(() => undefined)
        return
    }
    authGate.openAuthModal()
}

/**
 * Navigates back to the home page from the error layout.
 */
function handleBackHome(): void {
    router.push({ name: ROUTES.HOME }).catch(() => undefined)
}

const NAV_ITEMS = [
    { label: 'Продукт', href: '#features' },
    { label: 'Как работает', href: '#how' },
    { label: 'FAQ', href: '#faq' },
] as const
</script>

<template>
    <header
        class="sticky top-0 z-[50] transition-[background,border-color]"
        :class="scrolled
            ? 'bg-[color:rgb(244_247_247_/_0.88)] border-b border-[color:var(--color-line)] backdrop-blur-[10px]'
            : 'bg-transparent border-b border-transparent'"
    >
        <div class="mx-auto flex w-full max-w-[124rem] items-center gap-[2.4rem] px-[3.2rem] py-[1.8rem]">
            <RouterLink
                :to="{ name: ROUTES.HOME }"
                :aria-label="COPY.homeAriaLabel"
                class="inline-flex items-center"
            >
                <BrandLogo :size="28" />
            </RouterLink>

            <nav
                v-if="variant === 'public'"
                class="ml-[2.8rem] hidden items-center gap-[2.8rem] md:flex"
                :aria-label="COPY.navAriaLabel"
            >
                <a
                    v-for="item in NAV_ITEMS"
                    :key="item.href"
                    :href="item.href"
                    class="whitespace-nowrap text-[1.35rem] font-medium text-text-secondary transition-colors hover:text-text-primary"
                >
                    {{ item.label }}
                </a>
            </nav>

            <div class="flex-1" />

            <div
                v-if="variant === 'public'"
                class="flex items-center"
            >
                <button
                    type="button"
                    class="inline-flex h-[4rem] shrink-0 items-center gap-[0.8rem] whitespace-nowrap rounded-full bg-brand px-[2.2rem] text-[1.35rem] font-medium text-white shadow-primary transition hover:bg-brand-deep"
                    @click="handlePublicCta"
                >
                    {{ authGate.isAuthenticated ? COPY.ctaAuthenticated : COPY.ctaUnauthenticated }}
                    <MmArrow :size="12" />
                </button>
            </div>

            <div
                v-if="variant === 'error'"
                class="flex items-center"
            >
                <button
                    type="button"
                    class="inline-flex h-[3.6rem] items-center gap-[0.8rem] rounded-full border border-[color:var(--color-line-2)] bg-white px-[1.8rem] text-[1.3rem] font-medium text-text-primary transition hover:bg-surface-base"
                    @click="handleBackHome"
                >
                    {{ COPY.backHome }}
                </button>
            </div>
        </div>
    </header>
</template>
