<script setup lang="ts">
const COPY = {
    patientInitials: 'ПИ',
    category: 'Кардиология',
    patientName: 'Пётр Иванов',
    patientAge: '54 л.',
    patientSex: 'муж.',
    caseTitle: 'Давящая загрудинная боль с иррадиацией в руку',
    caseBrief: 'Сжимающая боль за грудиной 40 минут, иррадиация в левую руку. АГ и СД в анамнезе, курильщик.',
    difficulty: 'Сложный',
    cta: 'Начать кейс',
    catalogChip: 'Каталог · 240+ кейсов',
    scoreEyebrow: 'Разбор кейса',
    scoreValue: '88',
    scoreOutOf: '/ 100',
} as const
</script>

<template>
    <div
        class="relative w-full"
        style="min-height: 56rem; perspective: 120rem;"
    >
        <!-- Backdrop glow -->
        <div
            class="pointer-events-none absolute"
            style="top: 18%; left: 12%; width: 70%; height: 60%; background: radial-gradient(closest-side, rgb(13 115 119 / 18%), transparent 70%); filter: blur(0.6rem);"
            aria-hidden="true"
        />

        <!-- Main case card -->
        <div
            class="absolute left-1/2 top-[6rem] z-[3] flex w-[min(36rem,92%)] -translate-x-1/2 rotate-[-1deg] flex-col rounded-[1.4rem] border border-[color:var(--color-line)] bg-white p-[1.8rem] shadow-[0_40px_80px_-24px_rgb(10_31_31_/_0.22),0_12px_28px_-14px_rgb(10_31_31_/_0.12)]"
        >
            <div class="mb-[1.4rem] flex items-center gap-[1.2rem]">
                <div
                    class="relative flex h-[4.4rem] w-[4.4rem] shrink-0 items-center justify-center overflow-hidden rounded-[0.8rem]"
                    style="background: linear-gradient(135deg, #f0b5a8 0%, #c4584a 100%);"
                >
                    <span
                        class="relative font-serif text-[1.8rem] font-medium leading-none tracking-[-0.03em] text-white/95"
                    >{{ COPY.patientInitials }}</span>
                </div>
                <div class="flex min-w-0 flex-1 flex-col gap-[0.4rem]">
                    <div class="text-eyebrow-sm text-brand">{{ COPY.category }}</div>
                    <div class="truncate text-[1.15rem] text-text-tertiary">
                        <span class="font-medium text-text-secondary">{{ COPY.patientName }}</span>
                        <span class="mx-[0.6rem]">&middot;</span>
                        <span>{{ COPY.patientAge }}</span>
                        <span class="mx-[0.6rem]">&middot;</span>
                        <span>{{ COPY.patientSex }}</span>
                    </div>
                </div>
            </div>
            <div
                class="mb-[0.8rem] font-serif text-[1.9rem] font-medium leading-[1.22] tracking-[-0.01em] text-text-primary"
            >
                {{ COPY.caseTitle }}
            </div>
            <div class="mb-[1.4rem] text-[1.25rem] leading-[1.5] text-text-secondary">
                {{ COPY.caseBrief }}
            </div>
            <div class="flex items-center justify-between gap-[0.8rem] border-t border-[color:var(--color-line)] pt-[1.2rem]">
                <span
                    class="inline-flex items-center gap-[0.6rem] rounded-[0.4rem] bg-[color:var(--color-rose-soft)] px-[0.8rem] py-[0.3rem] text-eyebrow-sm text-[color:var(--color-rose-text)]"
                >
                    <span class="flex gap-[0.2rem]">
                        <span class="h-[0.4rem] w-[0.4rem] rounded-[0.1rem] bg-current" />
                        <span class="h-[0.4rem] w-[0.4rem] rounded-[0.1rem] bg-current" />
                        <span class="h-[0.4rem] w-[0.4rem] rounded-[0.1rem] bg-current" />
                    </span>
                    {{ COPY.difficulty }}
                </span>
                <span class="flex items-center gap-[0.4rem] text-[1.2rem] font-medium text-brand">
                    {{ COPY.cta }}
                    <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                    ><path
                        d="M3 6h6M6 3l3 3-3 3"
                        stroke="currentColor"
                        stroke-width="1.3"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    /></svg>
                </span>
            </div>
        </div>

        <!-- Catalog chip -->
        <div
            class="absolute left-[1rem] top-[1.4rem] z-[4] inline-flex rotate-[-4deg] items-center gap-[0.8rem] rounded-full border border-[color:var(--color-line)] bg-white px-[1.4rem] py-[0.8rem] text-eyebrow-sm text-brand shadow-[0_12px_28px_-12px_rgb(10_31_31_/_0.18)]"
        >
            <span class="h-[0.6rem] w-[0.6rem] rounded-full bg-brand anim-blink" />
            {{ COPY.catalogChip }}
        </div>

        <!-- Score sticker -->
        <div
            class="absolute bottom-[2rem] right-[2rem] z-[4] w-[20rem] rotate-[3deg] rounded-[1.4rem] bg-[color:var(--color-ink)] px-[1.8rem] py-[1.4rem] text-[color:var(--color-dark-ink)] shadow-float"
        >
            <div class="mb-[0.6rem] font-mono text-[0.95rem] font-semibold uppercase tracking-[0.16em] text-[color:rgb(234_244_243_/_0.65)]">
                {{ COPY.scoreEyebrow }}
            </div>
            <div class="mb-[0.8rem] flex items-baseline gap-[0.8rem]">
                <span class="font-serif text-[3.6rem] font-medium leading-none text-[color:var(--color-mint)]">{{ COPY.scoreValue }}</span>
                <span class="text-[1.2rem] text-[color:rgb(234_244_243_/_0.55)]">{{ COPY.scoreOutOf }}</span>
            </div>
            <div class="h-[0.4rem] overflow-hidden rounded-[0.2rem] bg-[color:rgb(159_198_194_/_0.2)]">
                <div
                    class="h-full bg-[color:var(--color-mint)]"
                    style="width: 88%;"
                />
            </div>
        </div>
    </div>
</template>
