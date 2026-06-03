<script setup lang="ts">
import { ref } from 'vue'

const COPY = {
    eyebrow: 'Частые вопросы',
    titleLead: 'Что обычно',
    titleAccent: 'спрашивают',
} as const

interface FaqItem {
    q: string
    a: string
}

const ITEMS: readonly FaqItem[] = [
    {
        q: 'Для кого предназначен MedMentor RAG?',
        a: 'Для студентов медицинских вузов (3–6 курс), ординаторов и молодых врачей. Система полезна и для преподавателей — как инструмент тренировки клинического мышления с контролируемой сложностью.',
    },
    {
        q: 'На каких языках доступен тренажёр?',
        a: 'Сейчас — русский. Индексированные гайдлайны — российские: клинические рекомендации Минздрава РФ, материалы РКО и других профильных обществ.',
    },
    {
        q: 'Откуда берётся медицинский контент?',
        a: 'Только из рецензируемых источников: национальные клинические рекомендации, руководства профессиональных обществ, приказы Минздрава. Каждая подсказка имеет ссылку на первоисточник.',
    },
    {
        q: 'Как происходит оценка моих действий?',
        a: 'Оценка складывается из трёх частей: полнота сбора данных, своевременность ключевых вмешательств, правильность формулировки диагноза по ICD-10. Все критерии видны в разборе.',
    },
    {
        q: 'Есть ли бесплатный доступ?',
        a: 'Да, 5 кейсов в базовых специальностях доступны без регистрации. Для расширенной библиотеки и отслеживания прогресса нужен аккаунт.',
    },
    {
        q: 'Можно ли использовать тренажёр в вузе?',
        a: 'Да. Мы подключаем кафедры за две недели, настраиваем дашборды групп и аналитику. Тренажёр не является медицинским устройством.',
    },
] as const

const openIndex = ref<number>(0)

function handleToggle(i: number): void {
    openIndex.value = openIndex.value === i ? -1 : i
}
</script>

<template>
    <section
        id="faq"
        class="bg-surface-base py-[12rem]"
    >
        <div class="mx-auto w-full max-w-[92rem] px-[3.2rem]">
            <div class="mb-[4.8rem] text-center">
                <p class="mb-[2rem] text-eyebrow text-brand">{{ COPY.eyebrow }}</p>
                <h2 class="font-serif text-[5.6rem] font-medium leading-[1.03] tracking-[-0.03em] text-text-primary">
                    {{ COPY.titleLead }}
                    <em class="italic text-brand">{{ COPY.titleAccent }}</em>
                </h2>
            </div>

            <div>
                <div
                    v-for="(item, i) in ITEMS"
                    :key="item.q"
                    class="cursor-pointer border-b border-[color:var(--color-line-2)] px-[0.4rem] py-[2.4rem]"
                    :class="i === 0 ? 'border-t border-[color:var(--color-line-2)]' : ''"
                    @click="handleToggle(i)"
                >
                    <div class="flex items-center gap-[1.6rem]">
                        <div class="flex-1 font-serif text-[2.2rem] font-medium leading-[1.2] tracking-[-0.02em] text-text-primary">
                            {{ item.q }}
                        </div>
                        <div
                            class="flex size-[3.2rem] shrink-0 items-center justify-center rounded-full border transition"
                            :class="openIndex === i
                                ? 'border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-white'
                                : 'border-[color:var(--color-line-2)] text-text-primary'"
                        >
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 12 12"
                                fill="none"
                                class="transition-transform"
                                :style="{ transform: openIndex === i ? 'rotate(45deg)' : 'none' }"
                            ><path
                                d="M6 2v8M2 6h8"
                                stroke="currentColor"
                                stroke-width="1.4"
                                stroke-linecap="round"
                            /></svg>
                        </div>
                    </div>
                    <div
                        class="overflow-hidden transition-all"
                        :style="{ maxHeight: openIndex === i ? '40rem' : '0', marginTop: openIndex === i ? '1.4rem' : 0 }"
                    >
                        <p class="max-w-[72rem] text-[1.45rem] leading-[1.65] text-text-secondary">
                            {{ item.a }}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
