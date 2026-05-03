<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import MmArrow from '@/components/common/MmArrow.vue'
import { HTTP_STATUS_UNAUTHORIZED } from '@/constants/http'
import { ROUTES } from '@/constants/routes'
import { useAuthGateStore } from '@/stores/authGate'
import { isApiError } from '@/utils/typeGuards'

const COPY = {
    closeAriaLabel: 'Закрыть',
    titleLead: 'Вход в',
    titleAccent: 'MedMentor',
    description: 'Продолжите свою тренировку с того места, где остановились.',
    usernameLabel: 'Логин',
    usernamePlaceholder: 'a.kovaleva',
    passwordLabel: 'Пароль',
    forgotLink: 'Забыли?',
    passwordPlaceholder: '••••••••••',
    submit: 'Войти',
    submitPending: 'Вход...',
} as const

const emit = defineEmits<{
    (event: 'close'): void
}>()

const router = useRouter()
const authGate = useAuthGateStore()

const username = ref('')
const password = ref('')
const usernameError = ref('')
const passwordError = ref('')
const formError = ref('')
const shake = ref(false)

const isOpen = computed({
    get: () => authGate.isAuthModalOpen,
    set: (value: boolean) => {
        if (!value) handleClose()
    },
})

watch(isOpen, (value) => {
    if (!value) {
        username.value = ''
        password.value = ''
        clearErrors()
    }
})

function clearErrors(): void {
    usernameError.value = ''
    passwordError.value = ''
    formError.value = ''
}

function triggerShake(): void {
    shake.value = true
    window.setTimeout(() => {
        shake.value = false
    }, 400)
}

function applyFieldErrors(fieldErrors: Record<string, string>): boolean {
    usernameError.value = fieldErrors.username ?? ''
    passwordError.value = fieldErrors.password ?? ''
    return Boolean(usernameError.value || passwordError.value)
}

function mapApiError(err: unknown): void {
    if (!isApiError(err)) {
        formError.value = 'Не удалось войти. Проверьте логин и пароль.'
        return
    }
    if (err.status === HTTP_STATUS_UNAUTHORIZED) {
        formError.value = 'Неверный логин или пароль.'
        return
    }
    if (err.status === 400 && err.fieldErrors) {
        if (!applyFieldErrors(err.fieldErrors)) {
            formError.value = err.error
        }
        return
    }
    if (err.status === 0) {
        formError.value = 'Ошибка сети. Проверьте соединение.'
        return
    }
    if (err.status >= 500) {
        formError.value = 'Ошибка сервера. Попробуйте позже.'
        return
    }
    formError.value = err.error || 'Не удалось войти.'
}

function handleClose(): void {
    authGate.closeAuthModal()
    emit('close')
}

function handleBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) handleClose()
}

async function handleSubmit(): Promise<void> {
    clearErrors()
    const trimmedUsername = username.value.trim()
    const trimmedPassword = password.value.trim()

    if (!trimmedUsername || !trimmedPassword) {
        if (!trimmedUsername) usernameError.value = 'Введите логин.'
        if (!trimmedPassword) passwordError.value = 'Введите пароль.'
        triggerShake()
        return
    }

    try {
        await authGate.login({ username: trimmedUsername, password: trimmedPassword })
        const target = authGate.consumeRedirectTarget()
        const isSafe = typeof target === 'string' && target.startsWith('/') && !target.startsWith('//')
        await router.push(isSafe ? target : { name: ROUTES.CASES })
    } catch (err: unknown) {
        mapApiError(err)
        triggerShake()
    }
}
</script>

<template>
    <Teleport to="body">
        <div
            v-if="isOpen"
            class="fixed inset-0 z-[100] flex items-center justify-center px-[2rem] anim-fade-in"
            style="background: rgb(10 31 31 / 50%); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);"
            @click="handleBackdropClick"
        >
            <div
                class="relative w-full max-w-[44rem] overflow-hidden rounded-[2rem] border border-[color:var(--color-line)] bg-white shadow-modal"
                :class="shake ? 'anim-shake' : 'anim-pop-in'"
                role="dialog"
                aria-modal="true"
            >
                <button
                    type="button"
                    class="absolute right-[1.6rem] top-[1.6rem] flex size-[3.2rem] items-center justify-center rounded-full border border-[color:var(--color-line-2)] text-text-secondary hover:bg-surface-base"
                    :aria-label="COPY.closeAriaLabel"
                    @click="handleClose"
                >
                    <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                    ><path
                        d="M3 3l6 6M9 3l-6 6"
                        stroke="currentColor"
                        stroke-width="1.4"
                        stroke-linecap="round"
                    /></svg>
                </button>

                <div class="px-[3.6rem] pb-[3.2rem] pt-[3.6rem]">
                    <div class="mb-[2rem] flex size-[4.4rem] items-center justify-center rounded-[1.2rem] bg-brand-faint">
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 40 40"
                            fill="none"
                        >
                            <path
                                d="M9 27V13l6 10 6-10v14"
                                stroke="var(--brand-primary)"
                                stroke-width="2.4"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                            <circle
                                cx="28"
                                cy="16"
                                r="3"
                                fill="var(--brand-primary)"
                            />
                            <path
                                d="M28 19v6M25 22h6"
                                stroke="var(--brand-primary)"
                                stroke-width="2"
                                stroke-linecap="round"
                            />
                        </svg>
                    </div>

                    <h2 class="mb-[0.8rem] font-serif text-[3rem] font-medium leading-[1.1] tracking-[-0.02em] text-text-primary">
                        {{ COPY.titleLead }}
                        <em class="italic text-brand">{{ COPY.titleAccent }}</em>
                    </h2>
                    <p class="mb-[2.4rem] text-[1.35rem] text-text-secondary">
                        {{ COPY.description }}
                    </p>

                    <div
                        v-if="formError"
                        class="mb-[1.6rem] rounded-[0.8rem] border border-[color:rgb(138_46_32_/_0.3)] bg-[color:var(--color-rose-soft)] px-[1.4rem] py-[1rem] text-[1.3rem] text-[color:var(--color-rose-text)]"
                    >
                        {{ formError }}
                    </div>

                    <form
                        class="flex flex-col gap-[1.4rem]"
                        @submit.prevent="handleSubmit"
                    >
                        <label class="block">
                            <span class="mb-[0.6rem] block text-eyebrow-sm text-text-secondary">{{ COPY.usernameLabel }}</span>
                            <input
                                v-model="username"
                                type="text"
                                autocomplete="username"
                                :placeholder="COPY.usernamePlaceholder"
                                class="h-[4.4rem] w-full rounded-[0.9rem] border bg-surface-base px-[1.4rem] text-[1.4rem] text-text-primary transition placeholder:text-text-tertiary focus:border-brand focus:bg-white focus:outline-none"
                                :class="usernameError ? 'border-[color:var(--color-danger-bright)]' : 'border-[color:var(--color-line-2)]'"
                                @input="usernameError = ''"
                            />
                            <p
                                v-if="usernameError"
                                class="mt-[0.4rem] text-[1.15rem] text-[color:var(--color-danger-bright)]"
                            >
                                {{ usernameError }}
                            </p>
                        </label>

                        <label class="block">
                            <div class="mb-[0.6rem] flex items-baseline justify-between">
                                <span class="text-eyebrow-sm text-text-secondary">{{ COPY.passwordLabel }}</span>
                                <a
                                    href="#"
                                    class="text-[1.15rem] text-brand hover:underline"
                                    @click.prevent
                                >{{ COPY.forgotLink }}</a>
                            </div>
                            <input
                                v-model="password"
                                type="password"
                                autocomplete="current-password"
                                :placeholder="COPY.passwordPlaceholder"
                                class="h-[4.4rem] w-full rounded-[0.9rem] border bg-surface-base px-[1.4rem] text-[1.4rem] text-text-primary transition placeholder:text-text-tertiary focus:border-brand focus:bg-white focus:outline-none"
                                :class="passwordError ? 'border-[color:var(--color-danger-bright)]' : 'border-[color:var(--color-line-2)]'"
                                @input="passwordError = ''"
                            />
                            <p
                                v-if="passwordError"
                                class="mt-[0.4rem] text-[1.15rem] text-[color:var(--color-danger-bright)]"
                            >
                                {{ passwordError }}
                            </p>
                        </label>

                        <button
                            type="submit"
                            :disabled="authGate.isLoginPending"
                            class="mt-[0.4rem] flex h-[4.6rem] w-full items-center justify-center gap-[0.8rem] rounded-[1rem] bg-brand text-[1.45rem] font-medium text-white shadow-primary transition hover:bg-brand-deep disabled:opacity-70"
                        >
                            <template v-if="authGate.isLoginPending">{{ COPY.submitPending }}</template>
                            <template v-else>
                                {{ COPY.submit }}
                                <MmArrow :size="14" />
                            </template>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </Teleport>
</template>
