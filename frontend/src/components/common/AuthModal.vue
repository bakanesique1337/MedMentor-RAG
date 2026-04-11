<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { VAlert, VButton, VInput, VModal } from '@/components/ui'
import { ROUTES } from '@/constants/routes'
import { useAuthGateStore } from '@/stores/authGate'
import { isApiError } from '@/types'

const emit = defineEmits<{
    (event: 'close'): void
}>()

const router = useRouter()
const authGate = useAuthGateStore()

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

const username = ref('')
const password = ref('')
const usernameError = ref('')
const passwordError = ref('')
const formError = ref('')

// ---------------------------------------------------------------------------
// Modal binding
// ---------------------------------------------------------------------------

const isOpen = computed({
    get: () => authGate.isAuthModalOpen,
    set: (value: boolean) => {
        if (!value) {
            handleClose()
        }
    },
})

const hasRedirectContext = computed(() => authGate.redirectTarget !== null)

// Reset form when modal opens; clear stale errors only when it closes
watch(isOpen, (value) => {
    if (value) {
        return
    }

    username.value = ''
    password.value = ''
    clearErrors()
})

// ---------------------------------------------------------------------------
// Error helpers
// ---------------------------------------------------------------------------

function clearErrors(): void {
    usernameError.value = ''
    passwordError.value = ''
    formError.value = ''
}

/** Applies field-level errors from a 400 response. Returns true if any field error was set. */
function applyFieldErrors(fieldErrors: Record<string, string>): boolean {
    usernameError.value = fieldErrors.username ?? ''
    passwordError.value = fieldErrors.password ?? ''
    return Boolean(usernameError.value || passwordError.value)
}

function mapApiError(err: unknown): void {
    if (!isApiError(err)) {
        formError.value = 'Sign-in failed. Check your credentials and try again.'
        return
    }

    if (err.status === 401) {
        formError.value = 'Incorrect username or password. Please try again.'
        return
    }

    if (err.status === 400 && err.fieldErrors) {
        if (!applyFieldErrors(err.fieldErrors)) {
            formError.value = err.error
        }
        return
    }

    if (err.status === 0) {
        formError.value = 'Network error. Check your connection and try again.'
        return
    }

    if (err.status >= 500) {
        formError.value = 'Server error. Please try again in a moment.'
        return
    }

    formError.value = err.error || 'Sign-in failed. Check your credentials and try again.'
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

function handleClose(): void {
    authGate.closeAuthModal()
    emit('close')
}

async function handleSubmit(): Promise<void> {
    clearErrors()

    const trimmedUsername = username.value.trim()
    const trimmedPassword = password.value.trim()

    if (!trimmedUsername) {
        usernameError.value = 'Username is required.'
    }

    if (!trimmedPassword) {
        passwordError.value = 'Password is required.'
    }

    if (usernameError.value || passwordError.value) {
        return
    }

    try {
        await authGate.login({ username: trimmedUsername, password: trimmedPassword })

        const target = authGate.consumeRedirectTarget()
        const isSafeTarget = typeof target === 'string' && target.startsWith('/') && !target.startsWith('//')

        await router.push(isSafeTarget ? target : { name: ROUTES.CASES })
    } catch (err: unknown) {
        mapApiError(err)
    }
}
</script>

<template>
    <VModal
        v-model="isOpen"
        title="Sign in"
        description="Sign in to access clinical cases and patient simulations."
        fullscreen
        @close="handleClose"
    >
        <form
            class="space-y-4"
            @keydown.enter.prevent="handleSubmit"
            @submit.prevent="handleSubmit"
        >
            <VAlert
                v-if="hasRedirectContext"
                status="info"
                title="Sign in required"
                description="You need to sign in to access the page you requested."
            />

            <VAlert
                v-if="formError"
                status="error"
                :description="formError"
            />

            <VInput
                v-model="username"
                label="Username"
                placeholder="resident"
                autocomplete="username"
                :error="usernameError"
                :invalid="Boolean(usernameError)"
                required
                @input="usernameError = ''"
            />

            <VInput
                v-model="password"
                type="password"
                label="Password"
                placeholder="Enter password"
                autocomplete="current-password"
                :error="passwordError"
                :invalid="Boolean(passwordError)"
                required
                @input="passwordError = ''"
            />

            <div class="flex flex-wrap justify-end gap-2 pt-1">
                <VButton
                    variant="ghost"
                    type="button"
                    @click="handleClose"
                >
                    Cancel
                </VButton>

                <VButton
                    type="submit"
                    :loading="authGate.isLoginPending"
                    :disabled="authGate.isLoginPending"
                >
                    Sign in
                </VButton>
            </div>
        </form>
    </VModal>
</template>
