<script setup lang="ts">
import MmArrow from '@/components/common/MmArrow.vue'
import LandingHeroVisual from '@/components/landing/LandingHeroVisual.vue'

const COPY = {
    eyebrow: 'Клинический тренажёр на базе LLM + RAG',
    titleLead: 'Тренируйте',
    titleAccent: 'клиническое',
    titleTail: 'мышление',
    titleSubline: 'на виртуальных пациентах.',
    subtitle: 'МедМентор RAG — тренажёр, где вы ведёте живой диалог с пациентом на русском, назначаете обследования и ставите диагноз. Система сверяет каждый ход с актуальными клиническими гайдлайнами.',
    ctaAuthenticated: 'Начать задачу',
    ctaUnauthenticated: 'Войти в аккаунт',
} as const

interface Props {
    isAuthenticated: boolean
}

defineProps<Props>()

const emit = defineEmits<{
    cta: []
}>()

function handleCta(): void {
    emit('cta')
}
</script>

<template>
    <section class="relative overflow-hidden pb-40 pt-16">
        <div
            class="absolute inset-0"
            style="background: linear-gradient(180deg, var(--color-cream-warm) 0%, var(--color-bg) 78%);"
            aria-hidden="true"
        />
        <div
            class="grid-backdrop pointer-events-none absolute inset-0 opacity-40"
            aria-hidden="true"
        />

        <div
            class="relative mx-auto grid w-full max-w-496 items-center gap-[5.6rem] px-[3.2rem] pt-[5.6rem] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]"
        >
            <div>
                <div
                    class="anim-fade-up mb-[2.8rem] inline-flex items-center gap-4 rounded-full bg-brand-faint px-[1.2rem] py-[0.6rem] text-eyebrow-sm text-brand"
                >
                    <span class="h-[0.6rem] w-[0.6rem] rounded-full bg-brand anim-blink"/>
                    {{ COPY.eyebrow }}
                </div>

                <h1
                    class="anim-fade-up mb-[2.4rem] font-serif text-[5.6rem] font-normal leading-[1.02] tracking-[-0.02em] text-text-primary sm:text-[7.2rem]"
                    style="letter-spacing: -0.022em;"
                >
                    {{ COPY.titleLead }}
                    <em class="italic text-brand">{{ COPY.titleAccent }}</em>
                    {{ COPY.titleTail }}<br/>
                    {{ COPY.titleSubline }}
                </h1>

                <p class="anim-fade-up mb-[3.6rem] max-w-208 text-[1.75rem] leading-[1.55] text-text-secondary">
                    {{ COPY.subtitle }}
                </p>

                <div class="anim-fade-up flex flex-wrap gap-[1.2rem]">
                    <button
                        type="button"
                        class="inline-flex h-[5.2rem] items-center gap-4 rounded-full bg-brand px-[2.6rem] text-[1.5rem] font-medium text-white shadow-primary-strong transition hover:bg-brand-deep hover:-translate-y-[0.1rem]"
                        @click="handleCta"
                    >
                        {{ isAuthenticated ? COPY.ctaAuthenticated : COPY.ctaUnauthenticated }}
                        <MmArrow :size="14"/>
                    </button>
                </div>
            </div>

            <div class="anim-fade-up relative min-h-216">
                <LandingHeroVisual/>
            </div>
        </div>
    </section>
</template>
