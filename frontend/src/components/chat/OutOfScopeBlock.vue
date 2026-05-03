<script setup lang="ts">
const COPY = {
    eyebrow: 'RAG-наставник · результат осмотра',
    disclaimer: 'Сгенерировано моделью на основе клинического контекста кейса.',
} as const

interface Props {
    finding: string
    meta: string
    isStreaming?: boolean
}

withDefaults(defineProps<Props>(), {
    isStreaming: false,
})
</script>

<template>
    <div class="oos-row">
        <div class="oos-block">
            <div class="oos-eyebrow">
                <span class="oos-badge">i</span>
                <span class="oos-eyebrow-text">{{ COPY.eyebrow }}</span>
            </div>

            <p class="oos-finding">
                <template v-if="finding">{{ finding }}</template>
                <span
                    v-if="isStreaming && !finding"
                    class="anim-blink"
                >...</span>
                <span
                    v-if="isStreaming && finding"
                    class="anim-caret ml-[0.1rem]"
                />
            </p>

            <div class="oos-disclaimer">
                <svg
                    class="oos-disclaimer-icon"
                    viewBox="0 0 12 12"
                    aria-hidden="true"
                >
                    <circle
                        cx="6"
                        cy="6"
                        r="5.25"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="0.9"
                    />
                    <path
                        d="M6 5.4v3"
                        stroke="currentColor"
                        stroke-width="1"
                        stroke-linecap="round"
                    />
                    <circle
                        cx="6"
                        cy="3.7"
                        r="0.55"
                        fill="currentColor"
                    />
                </svg>
                <span class="oos-disclaimer-text">{{ COPY.disclaimer }}</span>
                <span class="oos-disclaimer-meta">{{ meta }}</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.oos-row {
    display: flex;
    margin-top: 0.8rem;
    margin-bottom: 0.8rem;
    padding-left: 4.4rem;
}

.oos-block {
    position: relative;
    overflow: hidden;
    flex: 1;
    max-width: 68rem;
    padding: 1.2rem 1.6rem 1.2rem 1.8rem;
    border-radius: 1rem;
    border: 0.5px solid #0d7377;
    border-left: 0.3rem solid #0d7377;
    background-color: #fff;
    animation: oos-stream-in 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
    box-shadow:
        0 1px 3px rgb(13 115 119 / 8%),
        0 8px 24px -12px rgb(13 115 119 / 18%);
}

.oos-block:before {
    content: '';
    position: absolute;
    z-index: 0;
    background: linear-gradient(180deg, #e8f2f1 0%, transparent 60%);
    opacity: 0.5;
    inset: 0;
    pointer-events: none;
}

.oos-eyebrow,
.oos-finding,
.oos-disclaimer {
    position: relative;
    z-index: 1;
}

.oos-eyebrow {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    margin-bottom: 0.8rem;
}

.oos-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.8rem;
    height: 1.8rem;
    border-radius: 0.4rem;
    background-color: #0d7377;
    font-family: var(--font-mono), monospace;
    font-size: 1.1rem;
    font-weight: 700;
    line-height: 1;
    color: #fff;
}

.oos-eyebrow-text {
    flex: 1;
    text-transform: uppercase;
    font-family: var(--font-mono), monospace;
    font-size: 1.05rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    color: #08484b;
}

.oos-finding {
    white-space: pre-wrap;
    font-family: var(--font-serif), serif;
    font-size: 1.5rem;
    font-weight: 400;
    line-height: 1.5;
    letter-spacing: -0.01em;
    color: #0a1f1f;
    overflow-wrap: anywhere;
}

.oos-disclaimer {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-top: 1rem;
    padding-top: 0.8rem;
    border-top: 0.5px dashed rgb(10 31 31 / 10%);
    font-family: var(--font-mono), monospace;
    font-size: 1.05rem;
    letter-spacing: 0.04em;
    color: #8aa0a0;
}

.oos-disclaimer-icon {
    flex: 0 0 auto;
    width: 1.1rem;
    height: 1.1rem;
}

.oos-disclaimer-text {
    flex: 1;
}

.oos-disclaimer-meta {
    margin-left: auto;
    font-variant-numeric: tabular-nums;
}

@keyframes oos-stream-in {
    from {
        opacity: 0;
        transform: translateY(0.4rem);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>