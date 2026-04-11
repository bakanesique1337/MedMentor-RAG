<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { VAlert, VButton, VInput, VModal, } from '@/components/ui'
import { useAuthApi } from '@/composables/useAuthApi'
import { ROUTES } from '@/constants/routes'
import { useAuthGateStore } from '@/stores/authGate'

const emit = defineEmits<{
    (event: 'close'): void
}>()

const router = useRouter()
const authGate = useAuthGateStore()
const {login} = useAuthApi()

const username = ref('')
const password = ref('')
const formError = ref('')
const isSubmitting = ref(false)

const isOpen = computed({
    get: () => authGate.isAuthModalOpen,
    set: (value: boolean) => {
        if (!value) {
            handleClose()
        }
    },
})

const hasRedirectTarget = computed(() => authGate.redirectTarget !== null)

watch(isOpen, (value) => {
    if (value) {
        return
    }

    username.value = ''
    password.value = ''
    formError.value = ''
    isSubmitting.value = false
})

function handleClose(): void {
    authGate.closeAuthModal()
    emit('close')
}

async function handleSubmit(): Promise<void> {
    formError.value = ''

    if (username.value.trim().length === 0 || password.value.trim().length === 0) {
        formError.value = 'Enter both username and password to continue.'
        return
    }

    isSubmitting.value = true

    const redirectTarget = authGate.redirectTarget ?? undefined

    try {
        const user = await login({username: username.value, password: password.value})

        authGate.signIn(user)

        await router.push(redirectTarget ?? {name: ROUTES.CASES})

        authGate.consumeRedirectTarget()
    } catch (err: unknown) {
        formError.value = typeof err === 'object' && err !== null && 'error' in err
            ? String((err as { error: string }).error)
            : 'Sign-in failed. Check your credentials and try again.'
    } finally {
        isSubmitting.value = false
    }
}
</script>

<template>
    <VModal
        v-model="isOpen"
        title="Sign in to continue"
        description="MVP uses a modal auth entry instead of a dedicated login page."
        @close="handleClose"
    >
        <form
            class="space-y-3"
            @submit.prevent="handleSubmit"
        >
            <VAlert
                v-if="hasRedirectTarget"
                status="info"
                title="Protected destination requested"
                description="Complete sign-in to continue to the page you originally opened."
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
                required
            />

            <VInput
                v-model="password"
                type="password"
                label="Password"
                placeholder="Enter password"
                autocomplete="current-password"
                required
            />
        </form>

        <template #footer>
            <div class="flex flex-wrap justify-end gap-2">
                <VButton
                    variant="ghost"
                    @click="handleClose"
                >
                    Cancel
                </VButton>
                <VButton
                    :loading="isSubmitting"
                    @click="handleSubmit"
                >
                    Sign in
                </VButton>
            </div>
        </template>
    </VModal>
</template>
