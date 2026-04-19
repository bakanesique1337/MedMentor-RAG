<script setup lang="ts">
import { computed } from 'vue'

import type { MessageRole } from '@/types'

interface Props {
    role: MessageRole
    content: string
    isStreaming?: boolean
    patientInitials?: string
}

const props = withDefaults(defineProps<Props>(), {
    isStreaming: false,
    patientInitials: 'ПС',
})

const isDoctor = computed(() => props.role === 'DOCTOR')
const isSystem = computed(() => props.role === 'SYSTEM')
</script>

<template>
    <!-- System -->
    <div
        v-if="isSystem"
        class="flex items-center gap-[1rem] py-[1rem]"
    >
        <div class="h-[0.05rem] flex-1 bg-[color:var(--color-line)]" />
        <p class="text-eyebrow-sm text-brand">{{ content }}</p>
        <div class="h-[0.05rem] flex-1 bg-[color:var(--color-line)]" />
    </div>

    <!-- Doctor / Patient -->
    <div
        v-else
        class="flex items-start gap-[1.2rem] py-[0.8rem]"
        :class="isDoctor ? 'flex-row-reverse' : 'flex-row'"
    >
        <div
            class="flex size-[3.2rem] shrink-0 items-center justify-center rounded-full text-[1.1rem] font-bold text-white"
            :style="isDoctor
                ? 'background: linear-gradient(135deg, var(--color-teal-deep), #062e30); box-shadow: 0 2px 8px rgb(13 115 119 / 0.25);'
                : 'background: linear-gradient(135deg, #3a4a48, #1e2e2c); box-shadow: 0 1px 3px rgb(10 31 31 / 0.15);'"
        >
            {{ isDoctor ? 'Вы' : patientInitials }}
        </div>

        <div
            class="flex max-w-[70%] flex-col"
            :class="isDoctor ? 'items-end' : 'items-start'"
        >
            <p class="mb-[0.4rem] text-eyebrow-sm text-text-secondary">
                {{ isDoctor ? 'Вы — Студент' : 'Пациент' }}
            </p>
            <div
                class="whitespace-pre-wrap break-words px-[1.4rem] py-[1.1rem] text-[1.4rem] leading-[1.5]"
                :class="isDoctor
                    ? 'rounded-[1.4rem_0.4rem_1.4rem_1.4rem] bg-brand text-white shadow-[0_2px_8px_rgb(13_115_119_/_0.18)]'
                    : 'rounded-[0.4rem_1.4rem_1.4rem_1.4rem] border border-[color:var(--color-line)] bg-white text-text-primary shadow-[0_1px_2px_rgb(10_31_31_/_0.03)]'"
            >
                <template v-if="content">{{ content }}</template>
                <span
                    v-if="isStreaming && !content"
                    class="inline-block"
                >
                    <span class="anim-blink">...</span>
                </span>
                <span
                    v-if="isStreaming && content"
                    class="anim-caret ml-[0.1rem]"
                />
            </div>
        </div>
    </div>
</template>
