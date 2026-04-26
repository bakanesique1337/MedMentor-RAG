<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import ChatMessageBubble from '@/components/chat/ChatMessageBubble.vue'
import ExamFindingsCard from '@/components/chat/ExamFindingsCard.vue'
import type { ConversationMessage, PatientPassport, PatientVitals } from '@/types'

const COPY = {
    fallbackInitial: 'П',
    emptyState: 'Диалог появится здесь, как только пациент начнёт говорить.',
} as const

interface Props {
    messages: ConversationMessage[]
    pendingDoctorMessage?: string | null
    streamingContent: string
    isStreamingActive: boolean
    patientName?: string
    examRevealed?: boolean
    passport?: PatientPassport | null
    vitals?: PatientVitals | null
}

const props = withDefaults(defineProps<Props>(), {
    pendingDoctorMessage: null,
    patientName: 'Пациент',
    examRevealed: false,
    passport: null,
    vitals: null,
})

const timelineRef = ref<HTMLElement | null>(null)

const patientInitials = computed(() =>
    props.patientName
        .split(' ')
        .slice(0, 2)
        .map((p) => p[0] ?? '')
        .join('')
        .toUpperCase() || COPY.fallbackInitial,
)

/**
 * Scrolls the timeline container to the bottom.
 */
function scrollToBottom(): void {
    if (timelineRef.value) {
        timelineRef.value.scrollTop = timelineRef.value.scrollHeight
    }
}

watch(
    () => [props.messages.length, props.streamingContent, props.isStreamingActive, props.examRevealed] as const,
    scrollToBottom,
    { flush: 'post' },
)

onMounted(() => {
    scrollToBottom()
})
</script>

<template>
    <div
        ref="timelineRef"
        class="flex flex-1 flex-col overflow-y-auto px-[2.4rem] py-[1.2rem]"
    >
        <div class="mx-auto flex w-full max-w-[84rem] flex-col">
            <ChatMessageBubble
                v-for="msg in messages"
                :key="msg.id"
                :role="msg.role"
                :content="msg.content"
                :patient-initials="patientInitials"
            />

            <ChatMessageBubble
                v-if="pendingDoctorMessage"
                role="DOCTOR"
                :content="pendingDoctorMessage"
                :patient-initials="patientInitials"
            />

            <ChatMessageBubble
                v-if="isStreamingActive"
                role="PATIENT"
                :content="streamingContent"
                :is-streaming="true"
                :patient-initials="patientInitials"
            />

            <ExamFindingsCard
                v-if="examRevealed && !isStreamingActive"
                :passport="passport"
                :vitals="vitals"
            />

            <div
                v-if="messages.length === 0 && !isStreamingActive"
                class="flex flex-1 items-center justify-center py-[4rem] text-center"
            >
                <p class="text-[1.35rem] text-text-tertiary">
                    {{ COPY.emptyState }}
                </p>
            </div>
        </div>
    </div>
</template>
