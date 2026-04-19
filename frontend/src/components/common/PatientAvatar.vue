<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    name: string
    category?: string
    size?: number
}

const props = withDefaults(defineProps<Props>(), {
    category: 'Кардиология',
    size: 44,
})

const PALETTES: Record<string, [string, string]> = {
    'Кардиология':       ['#f0b5a8', '#c4584a'],
    'Пульмонология':     ['#cfe2ea', '#5a8ba3'],
    'Неврология':        ['#d6ccea', '#6e5d9e'],
    'Эндокринология':    ['#ecd5a0', '#b07f2a'],
    'Гастроэнтерология': ['#e8c39a', '#a8713b'],
    'Нефрология':        ['#bfd9d7', '#3d7f83'],
}

function adjust(hex: string, delta: number): string {
    const n = parseInt(hex.slice(1), 16)
    const r = Math.max(0, Math.min(255, ((n >> 16) & 0xff) + delta * 4))
    const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + delta * 4))
    const b = Math.max(0, Math.min(255, (n & 0xff) + delta * 4))
    return `rgb(${r}, ${g}, ${b})`
}

const FALLBACK_PAIR: [string, string] = ['#f0b5a8', '#c4584a']

const gradient = computed(() => {
    const pair = PALETTES[props.category] ?? FALLBACK_PAIR
    const hash = Array.from(props.name).reduce((a, c) => a + c.charCodeAt(0), 0)
    const shift = (hash % 5) - 2
    return `linear-gradient(135deg, ${adjust(pair[0], shift)} 0%, ${adjust(pair[1], shift)} 100%)`
})

const initials = computed(() =>
    props.name
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0] ?? '')
        .join('')
        .toUpperCase(),
)

const fontSize = computed(() => `${Math.round(props.size * 0.45) / 10}rem`)
const boxSize = computed(() => `${props.size / 10}rem`)
</script>

<template>
    <div
        class="relative flex shrink-0 items-center justify-center overflow-hidden rounded-[0.8rem]"
        :style="{ width: boxSize, height: boxSize, background: gradient }"
    >
        <svg
            class="absolute inset-0 opacity-20"
            width="100%"
            height="100%"
            viewBox="0 0 52 52"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
        >
            <circle
                cx="8"
                cy="46"
                r="28"
                fill="none"
                stroke="rgba(255,255,255,0.6)"
                stroke-width="0.4"
            />
            <circle
                cx="46"
                cy="6"
                r="22"
                fill="none"
                stroke="rgba(255,255,255,0.55)"
                stroke-width="0.4"
            />
        </svg>
        <span
            class="relative font-serif font-medium leading-none"
            :style="{ color: 'rgba(255,255,255,0.95)', fontSize, letterSpacing: '-0.03em' }"
        >{{ initials }}</span>
    </div>
</template>
