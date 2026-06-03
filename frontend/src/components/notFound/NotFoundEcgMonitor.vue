<script setup lang="ts">
defineOptions({name: 'NotFoundEcgMonitor'})

import {NOTFOUND_MONITOR_TEXTS} from '@/constants/notFoundViewTexts'
</script>

<template>
    <div class="mb-[1.4rem] text-eyebrow text-text-secondary">
        {{ NOTFOUND_MONITOR_TEXTS.eyebrow }}
    </div>

    <div
        class="ecg-frame relative overflow-hidden rounded-[1rem] px-[1.6rem] pb-[1.2rem] pt-[1.6rem]"
        style="background: var(--color-dark-bg); color: var(--color-dark-ink);"
    >
        <svg
            class="ecg-svg block h-[8.4rem] w-full sm:h-40"
            viewBox="0 0 400 100"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
        >
            <line
                x1="0"
                y1="55"
                x2="400"
                y2="55"
                stroke="rgb(125 184 182 / 0.18)"
                stroke-width="0.5"
                stroke-dasharray="2 4"
            />
            <path
                class="ecg-path"
                d="M4 55 L60 55 L72 55 L80 48 L88 62 L96 26 L104 80 L112 50 L120 55 L160 55 L396 55"
                stroke="#7db8b6"
                stroke-width="1.6"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <circle
                class="pulse-dot"
                cx="396"
                cy="55"
                r="3"
                fill="#ffb8a8"
            />
        </svg>

        <div class="mt-4 flex flex-wrap items-center justify-between gap-[1.4rem]">
            <div class="flex items-baseline gap-[0.6rem]">
                <span class="vital-label">{{ NOTFOUND_MONITOR_TEXTS.hrLabel }}</span>
                <span
                    class="font-serif text-[1.8rem] font-medium leading-none tabular sm:text-[2rem]"
                    style="color: #ffb8a8;"
                >{{ NOTFOUND_MONITOR_TEXTS.hrValue }}</span>
                <span class="vital-unit">{{ NOTFOUND_MONITOR_TEXTS.hrUnit }}</span>
            </div>
            <div class="flex items-baseline gap-[0.6rem]">
                <span class="vital-label">SpO<sub>2</sub></span>
                <span
                    class="font-serif text-[1.8rem] font-medium leading-none tabular sm:text-[2rem]"
                    style="color: var(--color-dark-ink);"
                >{{ NOTFOUND_MONITOR_TEXTS.spo2Value }}</span>
                <span class="vital-unit">{{ NOTFOUND_MONITOR_TEXTS.spo2Unit }}</span>
            </div>
            <div class="flex items-baseline gap-[0.6rem]">
                <span class="vital-label">{{ NOTFOUND_MONITOR_TEXTS.urlLabel }}</span>
                <span
                    class="font-serif text-[1.4rem] font-medium leading-none tabular"
                    style="color: var(--color-dark-ink);"
                >{{ NOTFOUND_MONITOR_TEXTS.urlValue }}</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
@keyframes mm-flatline-draw {
    from {
        stroke-dashoffset: 800;
    }

    to {
        stroke-dashoffset: 0;
    }
}

@keyframes mm-blip-pulse {
    0%, 100% {
        opacity: 0.35;
        r: 2.4;
    }

    50% {
        opacity: 1;
        r: 3.6;
    }
}

.ecg-frame:before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image: linear-gradient(to right, rgb(125 184 182 / 8%) 1px, transparent 1px),
    linear-gradient(to bottom, rgb(125 184 182 / 8%) 1px, transparent 1px);
    background-size: 1.4rem 1.4rem;
}

.ecg-svg {
    position: relative;
    overflow: visible;
}

.ecg-path {
    stroke-dasharray: 800;
    stroke-dashoffset: 800;
    animation: mm-flatline-draw 2.6s cubic-bezier(0.65, 0, 0.35, 1) 250ms forwards;
}

.pulse-dot {
    transform-origin: center;
    transform-box: fill-box;
    animation: mm-blip-pulse 1.6s ease-in-out infinite;
}

.vital-label {
    text-transform: uppercase;
    font-family: var(--font-mono), monospace;
    font-size: 0.95rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    color: #7db8b6;
}

.vital-unit {
    font-size: 1rem;
    color: #7db8b6;
}

@media (prefers-reduced-motion: reduce) {
    .ecg-path {
        animation: none;
        stroke-dashoffset: 0;
    }

    .pulse-dot {
        opacity: 0.7;
        animation: none;
    }
}
</style>