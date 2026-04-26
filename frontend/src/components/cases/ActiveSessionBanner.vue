<script setup lang="ts">
import MmArrow from '@/components/common/MmArrow.vue'
import type { ActiveSimulation } from '@/types'

const COPY = {
    badge: 'Активная симуляция',
    resumeButton: 'Вернуться',
} as const

interface Props {
    session: ActiveSimulation
}

const props = defineProps<Props>()

const emit = defineEmits<{
    resume: [sessionId: number]
}>()

/**
 * Emits resume with the current session id.
 */
function handleResume(): void {
    emit('resume', props.session.id)
}
</script>

<template>
    <div
        class="flex items-center gap-[1.4rem] rounded-[1.4rem] border border-[color:var(--color-teal-soft)] bg-brand-ghost px-[2rem] py-[1.6rem]"
    >
        <span
            class="inline-flex shrink-0 items-center gap-[0.6rem] rounded-full bg-white px-[1rem] py-[0.4rem] text-eyebrow-sm text-brand-deep"
        >
            <span class="h-[0.6rem] w-[0.6rem] rounded-full bg-brand anim-pulse" />
            {{ COPY.badge }}
        </span>
        <div class="flex min-w-0 flex-1 flex-col">
            <p class="truncate font-serif text-[1.6rem] font-medium leading-[1.25] tracking-[-0.01em] text-text-primary">
                {{ session.caseTitle }}
            </p>
            <p class="truncate text-[1.2rem] text-text-secondary">
                {{ session.patientName }}
            </p>
        </div>
        <button
            type="button"
            class="inline-flex h-[3.8rem] shrink-0 items-center gap-[0.8rem] rounded-full bg-brand px-[1.8rem] text-[1.3rem] font-medium text-white shadow-primary transition hover:bg-brand-deep"
            @click="handleResume"
        >
            {{ COPY.resumeButton }}
            <MmArrow :size="12" />
        </button>
    </div>
</template>
