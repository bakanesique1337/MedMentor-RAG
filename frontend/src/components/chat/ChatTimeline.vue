<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import ChatMessageBubble from '@/components/chat/ChatMessageBubble.vue'
import ChatSystemBubble from '@/components/chat/ChatSystemBubble.vue'
import ExamFindingsCard from '@/components/chat/ExamFindingsCard.vue'
import OutOfScopeBlock from '@/components/chat/OutOfScopeBlock.vue'
import { EXAM_CARD_MARKER } from '@/constants/chatMarkers'
import { MESSAGE_ROLE, STREAMING_STATUS_TYPE } from '@/types'
import type { ConversationMessage, PatientPassport, PatientVitals, StreamingStatusType } from '@/types'

const COPY = {
    fallbackInitial: 'П',
    emptyState: 'Диалог появится здесь, как только пациент начнёт говорить.',
    nowFallback: '--:--',
} as const

interface Props {
    messages: ConversationMessage[]
    pendingDoctorMessage?: string | null
    streamingContent: string
    streamingKind: StreamingStatusType | null
    patientName?: string
    passport?: PatientPassport | null
    vitals?: PatientVitals | null
}

const props = withDefaults(defineProps<Props>(), {
    pendingDoctorMessage: null,
    patientName: 'Пациент',
    passport: null,
    vitals: null,
})

const isStreamingActive = computed(() =>
    props.streamingKind !== null && props.streamingKind !== STREAMING_STATUS_TYPE.IDLE,
)
const isPatientStreamActive = computed(() =>
    props.streamingKind === STREAMING_STATUS_TYPE.MESSAGE
    || props.streamingKind === STREAMING_STATUS_TYPE.OPENING,
)
const isFindingStreamActive = computed(() => props.streamingKind === STREAMING_STATUS_TYPE.FINDING)
const isSystemStreamActive = computed(() => props.streamingKind === STREAMING_STATUS_TYPE.SYSTEM)

/**
 * Узнаёт, представляет ли SYSTEM-сообщение карточку осмотра, по sentinel-маркеру
 * в контенте (см. constants/chatMarkers). Это позволяет хранить разнородные
 * «события системы» в одной таблице и переключать рендер только на фронте.
 */
function isExamCardMessage(message: ConversationMessage): boolean {
    return message.role === MESSAGE_ROLE.SYSTEM && message.content === EXAM_CARD_MARKER
}

/**
 * Id первой по порядку SYSTEM-карточки осмотра в ленте, либо null если её нет.
 * Используется как фильтр против дубликатов: backend гарантирует ровно одну
 * карточку через атомарный UPDATE, но старые сессии, успевшие словить race,
 * могут содержать два маркера в БД. Рендерим только первый.
 */
const firstExamCardMessageId = computed<number | null>(() => {
    const first = props.messages.find(isExamCardMessage)
    return first === undefined ? null : first.id
})

function shouldRenderExamCard(message: ConversationMessage): boolean {
    return isExamCardMessage(message) && message.id === firstExamCardMessageId.value
}

const streamingMeta = ref<string>(COPY.nowFallback)

/**
 * Refreshes the live HH:MM stamp shown on the streaming OOS block. Computed once
 * when a finding stream begins to avoid per-chunk re-renders.
 */
function refreshStreamingMeta(): void {
    streamingMeta.value = formatTimestamp(new Date())
}

/**
 * Formats a Date or ISO timestamp string into HH:MM in local time.
 */
function formatTimestamp(value: Date | string): string {
    const date = typeof value === 'string' ? new Date(value) : value
    if (Number.isNaN(date.getTime())) return COPY.nowFallback
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

watch(isFindingStreamActive, (active) => {
    if (active) refreshStreamingMeta()
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
    () => [props.messages.length, props.streamingContent, isStreamingActive.value] as const,
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
            <template
                v-for="msg in messages"
                :key="msg.id"
            >
                <OutOfScopeBlock
                    v-if="msg.role === 'MENTOR'"
                    :finding="msg.content"
                    :meta="formatTimestamp(msg.timestamp)"
                />
                <ExamFindingsCard
                    v-else-if="shouldRenderExamCard(msg)"
                    :passport="passport"
                    :vitals="vitals"
                />
                <template v-else-if="isExamCardMessage(msg)">
                    <!-- Дубль __EXAM_CARD__ из старой сессии: ничего не рендерим. -->
                </template>
                <ChatSystemBubble
                    v-else-if="msg.role === 'SYSTEM'"
                    :content="msg.content"
                />
                <ChatMessageBubble
                    v-else
                    :role="msg.role"
                    :content="msg.content"
                    :patient-initials="patientInitials"
                />
            </template>

            <ChatMessageBubble
                v-if="pendingDoctorMessage"
                role="DOCTOR"
                :content="pendingDoctorMessage"
                :patient-initials="patientInitials"
            />

            <ChatMessageBubble
                v-if="isPatientStreamActive"
                role="PATIENT"
                :content="streamingContent"
                :is-streaming="true"
                :patient-initials="patientInitials"
            />

            <OutOfScopeBlock
                v-if="isFindingStreamActive"
                :finding="streamingContent"
                :meta="streamingMeta"
                :is-streaming="true"
            />

            <ChatSystemBubble
                v-if="isSystemStreamActive"
                :content="streamingContent"
                :is-streaming="true"
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
