<script setup lang="ts">
const COPY = {
    placeholder: 'Поиск по симптомам, пациенту, тегам...',
    clearAriaLabel: 'Очистить поиск',
} as const

interface Props {
    modelValue: string
}

defineProps<Props>()

const emit = defineEmits<{
    'update:modelValue': [value: string]
}>()

/**
 * Forwards typed search text to the parent.
 */
function handleInput(event: Event): void {
    const target = event.target
    if (target instanceof HTMLInputElement) {
        emit('update:modelValue', target.value)
    }
}

/**
 * Clears the field via the trailing reset button.
 */
function handleClear(): void {
    emit('update:modelValue', '')
}
</script>

<template>
    <label
        class="flex h-[3.4rem] w-[28rem] items-center gap-[0.8rem] rounded-[0.7rem] border border-[color:var(--color-line)] bg-surface-base px-[1.2rem] focus-within:border-brand"
    >
        <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            class="shrink-0 text-text-tertiary"
            aria-hidden="true"
        >
            <circle
                cx="6"
                cy="6"
                r="4.5"
                stroke="currentColor"
                stroke-width="1.2"
            />
            <path
                d="M9.5 9.5L12 12"
                stroke="currentColor"
                stroke-width="1.2"
                stroke-linecap="round"
            />
        </svg>
        <input
            :value="modelValue"
            type="search"
            :placeholder="COPY.placeholder"
            class="min-w-0 flex-1 border-0 bg-transparent p-0 text-[1.25rem] text-text-primary outline-none placeholder:text-text-tertiary"
            @input="handleInput"
        >
        <button
            v-if="modelValue.length > 0"
            type="button"
            class="flex size-[1.6rem] shrink-0 items-center justify-center rounded text-text-tertiary hover:text-text-primary"
            :aria-label="COPY.clearAriaLabel"
            @click="handleClear"
        >
            <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                aria-hidden="true"
            >
                <path
                    d="M1 1L9 9M9 1L1 9"
                    stroke="currentColor"
                    stroke-width="1.4"
                    stroke-linecap="round"
                />
            </svg>
        </button>
    </label>
</template>
