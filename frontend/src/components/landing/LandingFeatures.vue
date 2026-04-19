<script setup lang="ts">
interface ChatMessage {
    who: 'student' | 'patient'
    text: string
}

const CHAT_MESSAGES: readonly ChatMessage[] = [
    { who: 'student', text: 'Опишите характер боли.' },
    { who: 'patient', text: 'Сжимающая, будто обруч. В груди по центру.' },
    { who: 'student', text: 'Куда отдаёт?' },
    { who: 'patient', text: 'В левую руку и челюсть. Уже третий час…' },
] as const

interface RagCite {
    source: string
    section: string
    highlight: string
}

const RAG_CITES: readonly RagCite[] = [
    {
        source: 'Клинические рекомендации Минздрава РФ',
        section: 'ОКС без подъёма ST · 2023',
        highlight: 'ЭКГ в 12 отведениях в\u00A0течение 10\u00A0минут от первого медконтакта',
    },
    {
        source: 'РКО · Российское кардиологическое общество',
        section: 'Ведение ОКС · раздел 6.3',
        highlight: 'Высокочувствительный тропонин I как маркер некроза',
    },
    {
        source: 'Приказ Минздрава РФ',
        section: '№ 203н · критерии качества',
        highlight: 'Стратификация риска по GRACE в\u00A0первые часы',
    },
] as const

interface Criterion {
    key: string
    value: number
}

const CRITERIA: readonly Criterion[] = [
    { key: 'Сбор анамнеза', value: 85 },
    { key: 'Логика рассуждения', value: 80 },
    { key: 'Коммуникация', value: 76 },
    { key: 'Точность диагноза', value: 90 },
] as const
</script>

<template>
    <section
        id="features"
        class="bg-surface-base py-[12rem]"
    >
        <div class="mx-auto w-full max-w-[124rem] px-[3.2rem]">
            <div class="mb-[4.8rem]">
                <p class="mb-[2rem] text-eyebrow text-brand">Возможности</p>
                <h2 class="font-serif text-[5.6rem] font-medium leading-[1.03] tracking-[-0.03em] text-text-primary">
                    Тренажёр, приближенный
                    <em class="italic text-brand">к&nbsp;клинике</em>
                </h2>
                <p class="mt-[1.8rem] max-w-[52rem] text-[1.65rem] leading-[1.55] text-text-secondary">
                    Не заучивание тестов, а тренировка решений под давлением.
                </p>
            </div>

            <div class="flex flex-col gap-[2.4rem]">
                <!-- 01 Chat -->
                <article
                    class="grid gap-[4.8rem] rounded-[2rem] border border-[color:var(--color-line)] bg-white p-[4rem] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]"
                >
                    <div>
                        <div class="mb-[1.4rem] text-eyebrow text-brand">01 / 03</div>
                        <h3 class="mb-[1.6rem] font-serif text-[4rem] font-medium leading-[1.08] tracking-[-0.025em] text-text-primary">
                            Живой диалог с пациентом
                        </h3>
                        <p class="max-w-[48rem] text-[1.55rem] leading-[1.6] text-text-secondary">
                            Собирайте анамнез как в реальной клинике. Модель симулирует речь, эмоции и реакцию на ваши вопросы — от уклончивых ответов тревожного больного до ясной картины острого состояния.
                        </p>
                    </div>
                    <div class="flex flex-col gap-[1rem] rounded-[1.4rem] border border-[color:rgb(13_115_119_/_0.15)] bg-[color:var(--color-cream-warm)] p-[2rem]">
                        <div
                            v-for="(m, i) in CHAT_MESSAGES"
                            :key="i"
                            class="flex"
                            :class="m.who === 'student' ? 'justify-end' : 'justify-start'"
                        >
                            <div
                                class="max-w-[78%] px-[1.4rem] py-[1rem] text-[1.35rem] leading-[1.45]"
                                :class="m.who === 'student'
                                    ? 'rounded-[1.4rem_1.4rem_0.2rem_1.4rem] bg-[color:var(--color-ink)] text-[color:var(--color-dark-ink)]'
                                    : 'rounded-[1.4rem_1.4rem_1.4rem_0.2rem] border border-[color:var(--color-line)] bg-white text-text-primary'"
                            >
                                {{ m.text }}
                            </div>
                        </div>
                    </div>
                </article>

                <!-- 02 RAG -->
                <article
                    class="grid gap-[4.8rem] rounded-[2rem] border border-[color:var(--color-line)] bg-white p-[4rem] lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]"
                >
                    <div class="flex flex-col gap-[1rem] lg:order-2">
                        <div
                            v-for="(c, i) in RAG_CITES"
                            :key="i"
                            class="flex items-center gap-[1.4rem] rounded-[1rem] border border-[color:var(--color-line)] border-l-[0.3rem] border-l-brand bg-white px-[1.8rem] py-[1.6rem]"
                        >
                            <div class="min-w-0 flex-1">
                                <div class="mb-[0.6rem] text-eyebrow-sm text-brand">
                                    {{ c.source }}
                                </div>
                                <div class="mb-[0.4rem] text-[1.3rem] font-medium leading-[1.4] text-text-primary">
                                    <span v-html="c.highlight" />
                                </div>
                                <div class="text-[1.15rem] text-text-tertiary">
                                    {{ c.section }}
                                </div>
                            </div>
                            <svg
                                class="shrink-0 text-text-tertiary"
                                width="12"
                                height="12"
                                viewBox="0 0 12 12"
                                fill="none"
                            >
                                <path
                                    d="M4 2l4 4-4 4"
                                    stroke="currentColor"
                                    stroke-width="1.3"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                            </svg>
                        </div>
                    </div>
                    <div class="lg:order-1">
                        <div class="mb-[1.4rem] text-eyebrow text-brand">02 / 03</div>
                        <h3 class="mb-[1.6rem] font-serif text-[4rem] font-medium leading-[1.08] tracking-[-0.025em] text-text-primary">
                            RAG по клиническим гайдлайнам
                        </h3>
                        <p class="max-w-[48rem] text-[1.55rem] leading-[1.6] text-text-secondary">
                            Каждый ход модели подкреплён цитатами из актуальных российских рекомендаций: Минздрав РФ, РКО, РОАСЛ. Вы видите источник решения и&nbsp;можете его оспорить.
                        </p>
                    </div>
                </article>

                <!-- 03 Review -->
                <article
                    class="grid gap-[4.8rem] rounded-[2rem] border border-[color:var(--color-line)] bg-white p-[4rem] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]"
                >
                    <div>
                        <div class="mb-[1.4rem] text-eyebrow text-brand">03 / 03</div>
                        <h3 class="mb-[1.6rem] font-serif text-[4rem] font-medium leading-[1.08] tracking-[-0.025em] text-text-primary">
                            Разбор диагностики после кейса
                        </h3>
                        <p class="max-w-[48rem] text-[1.55rem] leading-[1.6] text-text-secondary">
                            Модель сравнивает ваш диагноз с эталоном и раскладывает итоговую оценку по критериям: полнота анамнеза, логика рассуждения, коммуникация, точность формулировки.
                        </p>
                    </div>
                    <div class="rounded-[1.4rem] border border-[color:var(--color-line)] bg-white p-[1.8rem]">
                        <div class="flex items-center justify-between border-b border-[color:var(--color-line)] pb-[1.4rem]">
                            <p class="text-eyebrow text-text-tertiary">Разбор вашей диагностики</p>
                            <div class="flex items-baseline gap-[0.3rem]">
                                <span class="font-serif text-[3rem] font-medium leading-none text-brand">83</span>
                                <span class="text-[1.1rem] text-text-tertiary">/ 100</span>
                            </div>
                        </div>

                        <div class="my-[1.4rem] grid grid-cols-2 gap-[0.8rem]">
                            <div class="rounded-[0.8rem] border border-[color:var(--color-line)] bg-surface-base px-[1.2rem] py-[1rem]">
                                <p class="mb-[0.5rem] text-eyebrow-sm text-text-tertiary">Ваш ответ</p>
                                <p class="text-[1.2rem] font-medium leading-[1.35] text-text-primary">
                                    ОКС без подъёма ST
                                </p>
                            </div>
                            <div class="rounded-[0.8rem] border border-[color:rgb(13_115_119_/_0.2)] bg-brand-faint px-[1.2rem] py-[1rem]">
                                <p class="mb-[0.5rem] text-eyebrow-sm text-brand">Эталон</p>
                                <p class="text-[1.2rem] font-medium leading-[1.35] text-text-primary">
                                    ОКС без подъёма ST
                                </p>
                            </div>
                        </div>

                        <div class="flex flex-col gap-[0.8rem]">
                            <div
                                v-for="c in CRITERIA"
                                :key="c.key"
                                class="grid grid-cols-[1fr_7rem_4rem] items-center gap-[1rem]"
                            >
                                <div class="text-[1.25rem] font-medium text-text-primary">
                                    {{ c.key }}
                                </div>
                                <div class="h-[0.4rem] overflow-hidden rounded-[0.2rem] bg-[color:rgb(10_31_31_/_0.06)]">
                                    <div
                                        class="h-full"
                                        :class="c.value >= 85 ? 'bg-brand' : c.value >= 75 ? 'bg-brand' : 'bg-[color:var(--color-amber)]'"
                                        :style="{ width: `${c.value}%` }"
                                    />
                                </div>
                                <div class="text-right font-mono text-[1.15rem] text-text-secondary">
                                    {{ c.value }}
                                </div>
                            </div>
                        </div>

                        <div
                            class="mt-[1.4rem] rounded-[0.8rem] border border-[color:rgb(13_115_119_/_0.2)] px-[1.2rem] py-[1rem]"
                            style="background: linear-gradient(135deg, #e8f2f1 0%, #d5e9e8 100%);"
                        >
                            <p class="font-serif text-[1.25rem] italic leading-[1.45] text-text-primary">
                                «Уверенная диагностическая логика. Зона роста — стратификация риска по&nbsp;шкале GRACE.»
                            </p>
                        </div>
                    </div>
                </article>
            </div>
        </div>
    </section>
</template>
