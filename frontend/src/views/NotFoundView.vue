<script setup lang="ts">
import {computed, markRaw, onMounted, onUnmounted, ref, type Component} from 'vue'
import {useRouter} from 'vue-router'

import VEnterIcon from '@/components/icons/VEnterIcon.vue'
import VGridIcon from '@/components/icons/VGridIcon.vue'
import VHomeIcon from '@/components/icons/VHomeIcon.vue'
import VUserIcon from '@/components/icons/VUserIcon.vue'
import NotFoundEcgMonitor from '@/components/notFound/NotFoundEcgMonitor.vue'
import NotFoundNavRow from '@/components/notFound/NotFoundNavRow.vue'
import {
    NOTFOUND_HEADER_TEXTS,
    NOTFOUND_HERO_TEXTS,
    NOTFOUND_INITIAL_CLOCK,
    NOTFOUND_NAV_TEXTS,
} from '@/constants/notFoundViewTexts'
import {ROUTES} from '@/constants/routes'
import {useAuthGateStore} from '@/stores/authGate'

interface DxItem {
    key: string
    title: string
    subtitle?: string
    icon: Component
    onClick: () => void
}

const router = useRouter()
const authGate = useAuthGateStore()

const time = ref<string>(NOTFOUND_INITIAL_CLOCK)
let timer: ReturnType<typeof setInterval> | null = null

function pad(value: number): string {
    return value < 10 ? `0${value}` : `${value}`
}

function tick(): void {
    const now = new Date()
    time.value = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

onMounted(() => {
    tick()
    timer = setInterval(tick, 1000)
})

onUnmounted(() => {
    if (timer !== null) {
        clearInterval(timer)
        timer = null
    }
})

function handleHome(): void {
    router.push({name: ROUTES.HOME}).catch(() => undefined)
}

function handleCases(): void {
    router.push({name: ROUTES.CASES}).catch(() => undefined)
}

function handleProfile(): void {
    router.push({name: ROUTES.PROFILE}).catch(() => undefined)
}

function handleLogin(): void {
    authGate.openAuthModal()
}

const dxItems = computed<DxItem[]>(() => {
    if (authGate.isAuthenticated) {
        return [
            {
                key: 'cases',
                title: NOTFOUND_NAV_TEXTS.casesTitle,
                subtitle: NOTFOUND_NAV_TEXTS.casesSubtitle,
                icon: markRaw(VGridIcon),
                onClick: handleCases,
            },
            {
                key: 'profile',
                title: NOTFOUND_NAV_TEXTS.profileTitle,
                subtitle: NOTFOUND_NAV_TEXTS.profileSubtitle,
                icon: markRaw(VUserIcon),
                onClick: handleProfile,
            },
            {
                key: 'home',
                title: NOTFOUND_NAV_TEXTS.homeTitle,
                icon: markRaw(VHomeIcon),
                onClick: handleHome,
            },
        ]
    }

    return [
        {
            key: 'home',
            title: NOTFOUND_NAV_TEXTS.homeTitle,
            icon: markRaw(VHomeIcon),
            onClick: handleHome,
        },
        {
            key: 'login',
            title: NOTFOUND_NAV_TEXTS.loginTitle,
            subtitle: NOTFOUND_NAV_TEXTS.loginSubtitle,
            icon: markRaw(VEnterIcon),
            onClick: handleLogin,
        },
    ]
})

</script>

<template>
    <div class="relative flex flex-1 items-center justify-center px-8 py-[4.8rem] sm:px-[2.8rem]">
        <div
            class="grid-backdrop mask-radial-fade pointer-events-none absolute inset-0 opacity-50"
            aria-hidden="true"
        />

        <article
            class="anim-fade-up relative w-full max-w-392 overflow-hidden rounded-[1.6rem] border border-(--color-line) bg-white shadow-card-elevated [animation-delay:80ms]"
        >
            <div
                class="flex flex-col items-start gap-[0.6rem] border-b border-(--color-line) bg-linear-to-b from-[#f7faf9] to-white px-[2.2rem] py-[1.2rem] sm:flex-row sm:items-center sm:justify-between"
            >
                <div class="font-mono text-[1.05rem] tracking-[0.06em] text-text-secondary">
                    {{ NOTFOUND_HEADER_TEXTS.timeLabel }}
                    <b class="ml-[0.4rem] font-medium text-text-primary tabular">{{ time }}</b>
                </div>
                <div class="font-mono text-[1.05rem] tracking-[0.06em] text-text-secondary sm:text-right">
                    {{ NOTFOUND_HEADER_TEXTS.departmentLabel }}
                    <b class="ml-[0.4rem] font-medium text-text-primary">{{ NOTFOUND_HEADER_TEXTS.departmentValue }}</b>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr]">
                <div class="px-[2.2rem] py-[2.8rem] sm:px-[3.6rem] sm:py-[3.6rem]">
                    <div class="mb-[1.2rem] inline-flex items-center gap-[0.8rem] text-eyebrow text-brand">
                        <span class="inline-block h-[0.6rem] w-[0.6rem] rounded-full bg-brand"/>
                        {{ NOTFOUND_HERO_TEXTS.eyebrow }}
                    </div>

                    <p
                        class="mb-[0.6rem] flex items-baseline gap-[0.2rem] font-serif text-[clamp(8.8rem,14vw,12.4rem)] font-medium leading-[0.95] tracking-[-0.04em] text-text-primary"
                    >
                        <span>{{ NOTFOUND_HERO_TEXTS.digitFour }}</span>
                        <em class="italic text-brand">{{ NOTFOUND_HERO_TEXTS.digitZero }}</em>
                        <span>{{ NOTFOUND_HERO_TEXTS.digitFour }}</span>
                    </p>

                    <h1 class="mb-[1.2rem] font-serif text-[2.6rem] font-medium leading-[1.18] tracking-[-0.01em] text-text-primary sm:text-[3.2rem] sm:leading-[1.12]">
                        {{ NOTFOUND_HERO_TEXTS.titleLead }}
                        <em class="italic text-brand">{{
                            NOTFOUND_HERO_TEXTS.titleAccent
                        }}</em>{{ NOTFOUND_HERO_TEXTS.titleTail }}
                    </h1>

                    <p class="max-w-3xl text-[1.45rem] leading-[1.6] text-text-secondary">
                        {{ NOTFOUND_HERO_TEXTS.description }}
                    </p>
                </div>

                <div
                    class="border-t border-(--color-line) bg-(--color-cream-warm)/40 px-[2.2rem] py-[2.4rem] sm:px-12 lg:border-l lg:border-t-0"
                >
                    <NotFoundEcgMonitor/>

                    <div
                        class="mt-[1.8rem] rounded-[1rem] border border-(--color-line) bg-white px-[1.6rem] py-[1.4rem]"
                    >
                        <div class="mb-4 flex items-center justify-between">
                            <div class="text-eyebrow text-text-secondary">
                                {{ NOTFOUND_NAV_TEXTS.eyebrow }}
                            </div>
                        </div>

                        <ul class="flex flex-col">
                            <NotFoundNavRow
                                v-for="(item, index) in dxItems"
                                :key="item.key"
                                :title="item.title"
                                :subtitle="item.subtitle"
                                :is-last="index === dxItems.length - 1"
                                @click="item.onClick"
                            >
                                <template #icon>
                                    <component :is="item.icon"/>
                                </template>
                            </NotFoundNavRow>
                        </ul>
                    </div>
                </div>
            </div>
        </article>
    </div>
</template>
