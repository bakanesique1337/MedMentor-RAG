<script setup lang="ts">
const COPY = {
    eyebrow: 'Процесс',
    titleLead: 'Четыре шага',
    titleAccent: 'от жалобы до диагноза',
    subtitle: 'Полный клинический цикл в одной сессии.',
} as const

interface Step {
    n: string
    title: string
    description: string
}

const STEPS: readonly Step[] = [
    { n: '01', title: 'Выбор кейса', description: 'Найдите кейс по специальности и уровню сложности.' },
    { n: '02', title: 'Диалог', description: 'Задавайте вопросы пациенту, собирайте анамнез, назначайте обследования.' },
    { n: '03', title: 'Диагноз', description: 'Сформулируйте диагноз по ICD-10 с обоснованием и планом ведения.' },
    { n: '04', title: 'Разбор', description: 'Получите детальный ревью хода, ссылки на гайдлайны и оценку.' },
] as const
</script>

<template>
    <section
        id="how"
        class="relative overflow-hidden bg-[color:var(--color-ink)] py-[12rem] text-[color:var(--color-dark-ink)]"
    >
        <div
            class="pointer-events-none absolute -right-[12rem] -top-[12rem] h-[40rem] w-[40rem] rounded-full"
            style="background: radial-gradient(circle, rgb(13 115 119 / 25%), transparent 70%);"
            aria-hidden="true"
        />
        <div class="relative mx-auto w-full max-w-[124rem] px-[3.2rem]">
            <div class="mb-[4.8rem]">
                <p class="mb-[2rem] text-eyebrow text-[color:var(--color-mint)]">{{ COPY.eyebrow }}</p>
                <h2 class="font-serif text-[5.6rem] font-medium leading-[1.03] tracking-[-0.03em] text-white">
                    {{ COPY.titleLead }}
                    <em class="italic text-[color:var(--color-mint)]">{{ COPY.titleAccent }}</em>
                </h2>
                <p class="mt-[1.8rem] max-w-[52rem] text-[1.65rem] leading-[1.55] text-[color:rgb(234_244_243_/_0.65)]">
                    {{ COPY.subtitle }}
                </p>
            </div>

            <div class="relative mt-[4.8rem] grid gap-[3.2rem] md:grid-cols-2 lg:grid-cols-4">
                <div
                    class="pointer-events-none absolute hidden h-[0.1rem] bg-[color:rgb(159_198_194_/_0.25)] lg:block"
                    style="top: 3rem; right: calc((100% - 9.6rem) / 8); left: calc((100% - 9.6rem) / 8);"
                    aria-hidden="true"
                />
                <div
                    v-for="step in STEPS"
                    :key="step.n"
                    class="relative flex flex-col items-center pt-[7rem] text-center"
                >
                    <div
                        class="absolute left-1/2 top-[1.6rem] flex size-[2.8rem] -translate-x-1/2 items-center justify-center rounded-full border-[0.15rem] border-[color:var(--color-mint)] bg-[color:var(--color-ink)] font-mono text-[1rem] font-semibold tracking-[0.04em] text-[color:var(--color-mint)]"
                    >
                        {{ step.n }}
                    </div>
                    <h4 class="mb-[1rem] font-serif text-[2.4rem] font-medium leading-[1.15] tracking-[-0.02em] text-white">
                        {{ step.title }}
                    </h4>
                    <p class="text-[1.4rem] leading-[1.55] text-[color:rgb(234_244_243_/_0.65)]">
                        {{ step.description }}
                    </p>
                </div>
            </div>
        </div>
    </section>
</template>
