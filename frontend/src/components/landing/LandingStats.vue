<script setup lang="ts">
interface StatItem {
    value: string
    label: string
}

const STATS: readonly StatItem[] = [
    { value: '240+', label: 'Клинических кейсов' },
    { value: '12', label: 'Специализаций' },
    { value: '94%', label: 'Покрытие гайдлайнами' },
    { value: '0.8 с', label: 'Отклик модели' },
] as const
</script>

<template>
    <section
        class="border-y border-[color:var(--color-line)] bg-white py-[3.6rem]"
    >
        <div class="mx-auto w-full max-w-[124rem] px-[3.2rem]">
            <div class="grid gap-[2rem] sm:grid-cols-2 lg:grid-cols-4">
                <div
                    v-for="(stat, i) in STATS"
                    :key="stat.label"
                    class="px-[2.4rem] py-[1rem]"
                    :class="i === 0 ? '' : 'lg:border-l lg:border-[color:var(--color-line)]'"
                >
                    <div class="mb-[0.8rem] font-serif text-[5.4rem] font-medium leading-none tracking-[-0.03em] text-text-primary">
                        {{ stat.value }}
                    </div>
                    <div class="text-[1.3rem] font-medium text-text-secondary">
                        {{ stat.label }}
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
