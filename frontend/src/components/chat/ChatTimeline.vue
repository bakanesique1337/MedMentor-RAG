<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import ChatMessageBubble from '@/components/chat/ChatMessageBubble.vue'
import type { ConversationMessage } from '@/types'

interface Props {
    messages: ConversationMessage[]
    pendingDoctorMessage?: string | null
    streamingContent: string
    isStreamingActive: boolean
    patientName?: string
}

const props = withDefaults(defineProps<Props>(), {
    pendingDoctorMessage: null,
    patientName: 'Пациент',
})

const timelineRef = ref<HTMLElement | null>(null)

const patientInitials = computed(() =>
    props.patientName
        .split(' ')
        .slice(0, 2)
        .map((p) => p[0] ?? '')
        .join('')
        .toUpperCase() || 'П',
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
    () => [props.messages.length, props.streamingContent, props.isStreamingActive] as const,
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

            <div
                v-if="messages.length === 0 && !isStreamingActive"
                class="flex flex-1 items-center justify-center py-[4rem] text-center"
            >
                <p class="text-[1.35rem] text-text-tertiary">
                    Диалог появится здесь, как только пациент начнёт говорить.
                </p>
            </div>
        </div>
    </div>
</template>
