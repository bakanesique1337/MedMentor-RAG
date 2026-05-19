<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from 'vue'
import {useRouter} from 'vue-router'

import {ROUTES} from '@/constants/routes'
import {useAuthGateStore} from '@/stores/authGate'

const COPY = {
    initialClock: '--:--:--',
    timeLabel: 'ВРЕМЯ ОБХОДА',
    departmentLabel: 'ОТДЕЛЕНИЕ',
    departmentValue: 'SYS · INFRA',
    diagnosticEyebrow: 'Диагностический отчёт',
    titleLead: 'Запрошенная страница',
    titleAccent: 'не найдена',
    titleTail: '.',
    description: 'Маршрутизатор выполнил поиск по симптомам URL и не нашёл соответствующего пациента в базе задач. Возможно, ссылка устарела, либо адрес введён с опечаткой. Рекомендуем вернуться к каталогу или продолжить обучение с другой страницы.',
    monitorEyebrow: 'Кардиомонитор маршрута',
    vitalHrLabel: 'HR',
    vitalHrValue: '— —',
    vitalHrUnit: 'bpm',
    vitalSpo2Value: '—',
    vitalSpo2Unit: '%',
    vitalUrlLabel: 'URL',
    vitalUrlValue: '404',
    diffNavEyebrow: 'Дифференциальная навигация',
    countSuffix: 'ВАРИАНТА',
    digitFour: '4',
    digitZero: '0',
    casesTitle: 'Каталог кейсов',
    casesSubtitle: 'Клинические задачи для тренировки',
    profileTitle: 'Мой профиль',
    profileSubtitle: 'Прогресс, статистика, настройки',
    homeTitle: 'На главную',
    loginTitle: 'Войти в аккаунт',
    loginSubtitle: 'Открыть каталог кейсов и профиль',
} as const

interface DxItem {
    key: string
    title: string
    subtitle?: string
    icon: 'cases' | 'profile' | 'home' | 'login'
    onClick: () => void
}

const router = useRouter()
const authGate = useAuthGateStore()

const time = ref<string>(COPY.initialClock)
let timer: ReturnType<typeof setInterval> | null = null

/**
 * Pads a number to a 2-character zero-prefixed string.
 */
function pad(value: number): string {
    return value < 10 ? `0${value}` : `${value}`
}

/**
 * Updates the displayed clock to the current local time (HH:MM:SS).
 */
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

/**
 * Navigates to the home (landing) view.
 */
function handleHome(): void {
    router.push({name: ROUTES.HOME}).catch(() => undefined)
}

/**
 * Navigates to the cases catalog.
 */
function handleCases(): void {
    router.push({name: ROUTES.CASES}).catch(() => undefined)
}

/**
 * Navigates to the user's profile.
 */
function handleProfile(): void {
    router.push({name: ROUTES.PROFILE}).catch(() => undefined)
}

/**
 * Opens the auth modal for unauthenticated visitors.
 */
function handleLogin(): void {
    authGate.openAuthModal()
}

const dxItems = computed<DxItem[]>(() => {
    if (authGate.isAuthenticated) {
        return [
            {
                key: 'cases',
                title: COPY.casesTitle,
                subtitle: COPY.casesSubtitle,
                icon: 'cases',
                onClick: handleCases,
            },
            {
                key: 'profile',
                title: COPY.profileTitle,
                subtitle: COPY.profileSubtitle,
                icon: 'profile',
                onClick: handleProfile,
            },
            {
                key: 'home',
                title: COPY.homeTitle,
                icon: 'home',
                onClick: handleHome,
            },
        ]
    }

    return [
        {
            key: 'home',
            title: COPY.homeTitle,
            icon: 'home',
            onClick: handleHome,
        },
        {
            key: 'login',
            title: COPY.loginTitle,
            subtitle: COPY.loginSubtitle,
            icon: 'login',
            onClick: handleLogin,
        },
    ]
})

</script>

<template>
    <div class="relative flex flex-1 items-center justify-center px-[2rem] py-[4.8rem] sm:px-[2.8rem]">
        <div
            class="grid-backdrop pointer-events-none absolute inset-0 opacity-50"
            style="
                   -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);"
            aria-hidden="true"
        />

        <article
            class="anim-fade-up relative w-full max-w-[98rem] overflow-hidden rounded-[1.6rem] border border-[color:var(--color-line)] bg-white"
            style="box-shadow: 0 20px 60px -30px rgb(10 31 31 / 25%), 0 1px 0 rgb(255 255 255 / 60%) inset;
                   animation-delay: 80ms;"
        >
            <!-- Card strip -->
            <div
                class="flex flex-col items-start gap-[0.6rem] border-b border-[color:var(--color-line)] px-[2.2rem] py-[1.2rem] sm:flex-row sm:items-center sm:justify-between"
                style="background: linear-gradient(180deg, #f7faf9 0%, #fff 100%);"
            >
                <div class="font-mono text-[1.05rem] tracking-[0.06em] text-text-secondary">
                    {{ COPY.timeLabel }}
                    <b class="ml-[0.4rem] font-medium text-text-primary tabular">{{ time }}</b>
                </div>
                <div class="font-mono text-[1.05rem] tracking-[0.06em] text-text-secondary sm:text-right">
                    {{ COPY.departmentLabel }}
                    <b class="ml-[0.4rem] font-medium text-text-primary">{{ COPY.departmentValue }}</b>
                </div>
            </div>

            <!-- Body grid -->
            <div class="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr]">
                <!-- Left: hero copy -->
                <div class="px-[2.2rem] py-[2.8rem] sm:px-[3.6rem] sm:py-[3.6rem]">
                    <div class="mb-[1.2rem] inline-flex items-center gap-[0.8rem] text-eyebrow text-brand">
                        <span class="inline-block h-[0.6rem] w-[0.6rem] rounded-full bg-brand"/>
                        {{ COPY.diagnosticEyebrow }}
                    </div>

                    <p
                        class="mb-[0.6rem] flex items-baseline gap-[0.2rem] font-serif font-medium leading-[0.95] tracking-[-0.04em] text-text-primary"
                        style="font-size: clamp(8.8rem, 14vw, 12.4rem);"
                    >
                        <span>{{ COPY.digitFour }}</span>
                        <em class="italic text-brand">{{ COPY.digitZero }}</em>
                        <span>{{ COPY.digitFour }}</span>
                    </p>

                    <h1 class="mb-[1.2rem] font-serif text-[2.6rem] font-medium leading-[1.18] tracking-[-0.01em] text-text-primary sm:text-[3.2rem] sm:leading-[1.12]">
                        {{ COPY.titleLead }}
                        <em class="italic text-brand">{{ COPY.titleAccent }}</em>{{ COPY.titleTail }}
                    </h1>

                    <p class="max-w-[48rem] text-[1.45rem] leading-[1.6] text-text-secondary">
                        {{ COPY.description }}
                    </p>
                </div>

                <!-- Right: monitor + diagnostic list -->
                <div
                    class="border-t border-[color:var(--color-line)] bg-[color:var(--color-cream-warm)]/40 px-[2.2rem] py-[2.4rem] sm:px-[3rem] lg:border-l lg:border-t-0"
                >
                    <div class="mb-[1.4rem] text-eyebrow text-text-secondary">
                        {{ COPY.monitorEyebrow }}
                    </div>

                    <!-- ECG frame -->
                    <div
                        class="ecg-frame relative overflow-hidden rounded-[1rem] px-[1.6rem] pb-[1.2rem] pt-[1.6rem]"
                        style="background: var(--color-dark-bg); color: var(--color-dark-ink);"
                    >
                        <svg
                            class="ecg-svg block h-[8.4rem] w-full sm:h-[10rem]"
                            viewBox="0 0 400 100"
                            preserveAspectRatio="xMidYMid meet"
                            aria-hidden="true"
                        >
                            <line
                                x1="0"
                                y1="55"
                                x2="400"
                                y2="55"
                                stroke="rgb(125 184 182 / 0.18)"
                                stroke-width="0.5"
                                stroke-dasharray="2 4"
                            />
                            <path
                                class="ecg-path"
                                d="M4 55 L60 55 L72 55 L80 48 L88 62 L96 26 L104 80 L112 50 L120 55 L160 55 L396 55"
                                stroke="#7db8b6"
                                stroke-width="1.6"
                                fill="none"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                            <circle
                                class="pulse-dot"
                                cx="396"
                                cy="55"
                                r="3"
                                fill="#ffb8a8"
                            />
                        </svg>

                        <div class="mt-[1rem] flex flex-wrap items-center justify-between gap-[1.4rem]">
                            <div class="flex items-baseline gap-[0.6rem]">
                                <span class="vital-label">{{ COPY.vitalHrLabel }}</span>
                                <span
                                    class="font-serif text-[1.8rem] font-medium leading-none tabular sm:text-[2rem]"
                                    style="color: #ffb8a8;"
                                >{{ COPY.vitalHrValue }}</span>
                                <span class="vital-unit">{{ COPY.vitalHrUnit }}</span>
                            </div>
                            <div class="flex items-baseline gap-[0.6rem]">
                                <span class="vital-label">SpO<sub>2</sub></span>
                                <span
                                    class="font-serif text-[1.8rem] font-medium leading-none tabular sm:text-[2rem]"
                                    style="color: var(--color-dark-ink);"
                                >{{ COPY.vitalSpo2Value }}</span>
                                <span class="vital-unit">{{ COPY.vitalSpo2Unit }}</span>
                            </div>
                            <div class="flex items-baseline gap-[0.6rem]">
                                <span class="vital-label">{{ COPY.vitalUrlLabel }}</span>
                                <span
                                    class="font-serif text-[1.4rem] font-medium leading-none tabular"
                                    style="color: var(--color-dark-ink);"
                                >{{ COPY.vitalUrlValue }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Diagnostic list -->
                    <div
                        class="mt-[1.8rem] rounded-[1rem] border border-[color:var(--color-line)] bg-white px-[1.6rem] py-[1.4rem]"
                    >
                        <div class="mb-[1rem] flex items-center justify-between">
                            <div class="text-eyebrow text-text-secondary">
                                {{ COPY.diffNavEyebrow }}
                            </div>
                        </div>

                        <ul class="flex flex-col">
                            <li
                                v-for="(item, index) in dxItems"
                                :key="item.key"
                                class="dx-row"
                                :class="index === dxItems.length - 1 ? '' : 'border-b border-[color:var(--color-line)]'"
                            >
                                <button
                                    type="button"
                                    class="group flex w-full items-center gap-[1.2rem] py-[1rem] text-left transition-[padding] duration-[140ms]"
                                    @click="item.onClick"
                                >
                                    <span
                                        class="inline-flex h-[2.8rem] w-[2.8rem] shrink-0 items-center justify-center rounded-[0.7rem] bg-brand-ghost text-brand"
                                    >
                                        <!-- cases -->
                                        <svg
                                            v-if="item.icon === 'cases'"
                                            width="14"
                                            height="14"
                                            viewBox="0 0 14 14"
                                            fill="none"
                                            aria-hidden="true"
                                        >
                                            <rect
                                                x="1.5"
                                                y="1.5"
                                                width="5"
                                                height="5"
                                                rx="0.8"
                                                stroke="currentColor"
                                                stroke-width="1.2"
                                            />
                                            <rect
                                                x="7.5"
                                                y="1.5"
                                                width="5"
                                                height="5"
                                                rx="0.8"
                                                stroke="currentColor"
                                                stroke-width="1.2"
                                            />
                                            <rect
                                                x="1.5"
                                                y="7.5"
                                                width="5"
                                                height="5"
                                                rx="0.8"
                                                stroke="currentColor"
                                                stroke-width="1.2"
                                            />
                                            <rect
                                                x="7.5"
                                                y="7.5"
                                                width="5"
                                                height="5"
                                                rx="0.8"
                                                stroke="currentColor"
                                                stroke-width="1.2"
                                            />
                                        </svg>
                                        <!-- profile -->
                                        <svg
                                            v-else-if="item.icon === 'profile'"
                                            width="14"
                                            height="14"
                                            viewBox="0 0 14 14"
                                            fill="none"
                                            aria-hidden="true"
                                        >
                                            <circle
                                                cx="7"
                                                cy="5"
                                                r="2.5"
                                                stroke="currentColor"
                                                stroke-width="1.2"
                                            />
                                            <path
                                                d="M2.5 12C2.5 9.8 4.5 8 7 8C9.5 8 11.5 9.8 11.5 12"
                                                stroke="currentColor"
                                                stroke-width="1.2"
                                                stroke-linecap="round"
                                            />
                                        </svg>
                                        <!-- home -->
                                        <svg
                                            v-else-if="item.icon === 'home'"
                                            width="14"
                                            height="14"
                                            viewBox="0 0 14 14"
                                            fill="none"
                                            aria-hidden="true"
                                        >
                                            <path
                                                d="M2 6.2L7 2L12 6.2V11.5C12 11.8 11.8 12 11.5 12H8.8V8.8H5.2V12H2.5C2.2 12 2 11.8 2 11.5V6.2Z"
                                                stroke="currentColor"
                                                stroke-width="1.2"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                            />
                                        </svg>
                                        <!-- login -->
                                        <svg
                                            v-else
                                            width="14"
                                            height="14"
                                            viewBox="0 0 14 14"
                                            fill="none"
                                            aria-hidden="true"
                                        >
                                            <path
                                                d="M6 2H10.5C11 2 11.5 2.5 11.5 3V11C11.5 11.5 11 12 10.5 12H6"
                                                stroke="currentColor"
                                                stroke-width="1.2"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                            />
                                            <path
                                                d="M2.5 7H8.5M6 4.5L8.5 7L6 9.5"
                                                stroke="currentColor"
                                                stroke-width="1.2"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                            />
                                        </svg>
                                    </span>

                                    <span class="min-w-0 flex-1">
                                        <span class="block text-[1.3rem] font-medium text-text-primary">{{
                                            item.title
                                        }}</span>
                                        <span class="mt-[0.1rem] block text-[1.15rem] text-text-tertiary">{{
                                            item.subtitle
                                        }}</span>
                                    </span>

                                    <span
                                        class="dx-arrow text-[color:rgb(10_31_31_/_0.18)] transition-[color,transform] duration-[140ms] group-hover:text-brand"
                                    >
                                        <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 14 14"
                                            fill="none"
                                            aria-hidden="true"
                                        >
                                            <path
                                                d="M5 2L10 7L5 12"
                                                stroke="currentColor"
                                                stroke-width="1.4"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                            />
                                        </svg>
                                    </span>
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </article>
    </div>
</template>

<style scoped>
@keyframes mm-flatline-draw {
    from {
        stroke-dashoffset: 800;
    }

    to {
        stroke-dashoffset: 0;
    }
}

@keyframes mm-blip-pulse {
    0%, 100% {
        opacity: 0.35;
        r: 2.4;
    }

    50% {
        opacity: 1;
        r: 3.6;
    }
}

.ecg-frame:before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image: linear-gradient(to right, rgb(125 184 182 / 8%) 1px, transparent 1px),
    linear-gradient(to bottom, rgb(125 184 182 / 8%) 1px, transparent 1px);
    background-size: 1.4rem 1.4rem;
}

.ecg-svg {
    position: relative;
    overflow: visible;
}

.ecg-path {
    stroke-dasharray: 800;
    stroke-dashoffset: 800;
    animation: mm-flatline-draw 2.6s cubic-bezier(0.65, 0, 0.35, 1) 250ms forwards;
}

.pulse-dot {
    transform-origin: center;
    transform-box: fill-box;
    animation: mm-blip-pulse 1.6s ease-in-out infinite;
}

.vital-label {
    text-transform: uppercase;
    font-family: var(--font-mono), monospace;
    font-size: 0.95rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    color: #7db8b6;
}

.vital-unit {
    font-size: 1rem;
    color: #7db8b6;
}

.dx-row .group:hover {
    padding-left: 0.4rem;
}

.dx-row .group:hover .dx-arrow {
    transform: translateX(0.2rem);
}

@media (prefers-reduced-motion: reduce) {
    .ecg-path {
        animation: none;
        stroke-dashoffset: 0;
    }

    .pulse-dot {
        opacity: 0.7;
        animation: none;
    }
}
</style>
