<script setup lang="ts">
import { useRouter } from 'vue-router'

import { VButton } from '@/components/ui'
import { ROUTES } from '@/constants/routes'
import type { ActiveSimulation } from '@/types'

interface Props {
    session: ActiveSimulation
}

const props = defineProps<Props>()
const router = useRouter()

/**
 * Navigates to the active session's chat page.
 */
async function handleResume(): Promise<void> {
    await router.push({ name: ROUTES.CHAT, params: { sessionId: String(props.session.id) } })
}
</script>

<template>
    <div class="flex items-center justify-between gap-4 rounded-2xl border border-border-default bg-surface-elevated px-4 py-3">
        <div class="flex flex-col gap-0.5">
            <p class="text-body-sm font-semibold text-text-primary">Unfinished session</p>
            <p class="text-label text-text-secondary">
                {{ session.caseTitle }} &mdash; {{ session.patientName }}
            </p>
        </div>
        <VButton
            size="sm"
            variant="secondary"
            @click="handleResume"
        >
            Resume
        </VButton>
    </div>
</template>
