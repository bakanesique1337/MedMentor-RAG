<script setup lang="ts">
import { computed } from 'vue'

import type { SpecialtyRow } from '@/utils/profileAggregations'

const COPY = {
    eyebrow: 'По специализациям',
} as const

interface Props {
    items: SpecialtyRow[]
}

const props = defineProps<Props>()

interface RowVm extends SpecialtyRow {
    pct: number;
    swatchStyle: { background: string };
    barStyle: { width: string; background: string };
}

const rows = computed<RowVm[]>(() =>
    props.items.map((item) => {
        const pct = item.total > 0 ? Math.max(0, Math.min(100, (item.done / item.total) * 100)) : 0
        const gradient = `linear-gradient(135deg, ${item.paletteFrom}, ${item.paletteTo})`
        const horizontal = `linear-gradient(90deg, ${item.paletteFrom}, ${item.paletteTo})`
        return {
            ...item,
            pct,
            swatchStyle: { background: gradient },
            barStyle: { width: `${pct}%`, background: horizontal },
        }
    }),
)
</script>

<template>
    <div class="rounded-[1.4rem] border border-[color:var(--color-line)] bg-white px-[2rem] py-[1.8rem]">
        <p class="mb-[1.8rem] text-eyebrow text-text-tertiary">
            {{ COPY.eyebrow }}
        </p>

        <div class="flex flex-col gap-[1.6rem]">
            <div
                v-for="row in rows"
                :key="row.key"
            >
                <div class="mb-[0.6rem] flex items-baseline justify-between gap-[1rem]">
                    <div class="flex min-w-0 items-center gap-[0.8rem]">
                        <span
                            class="h-[1rem] w-[1rem] shrink-0 rounded-[0.3rem]"
                            :style="row.swatchStyle"
                        />
                        <span class="truncate text-[1.3rem] font-medium text-text-primary">
                            {{ row.label }}
                        </span>
                    </div>
                    <div class="whitespace-nowrap font-mono text-[1.15rem] tabular text-text-tertiary">
                        <span class="font-medium text-text-primary">{{ row.done }}</span>
                        <span class="mx-[0.4rem]">/</span>
                        <span>{{ row.total }}</span>
                        <span
                            v-if="row.score > 0"
                            class="ml-[0.8rem] text-brand"
                        >{{ row.score }}</span>
                    </div>
                </div>
                <div class="relative h-[0.6rem] overflow-hidden rounded-[0.3rem] bg-[color:rgb(10_31_31_/_0.05)]">
                    <div
                        class="absolute inset-y-0 left-0 rounded-[0.3rem] transition-[width] duration-[400ms]"
                        :style="row.barStyle"
                    />
                </div>
            </div>
        </div>
    </div>
</template>
