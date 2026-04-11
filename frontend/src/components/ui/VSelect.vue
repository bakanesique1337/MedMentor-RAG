<script setup lang="ts">
import { onClickOutside, onKeyStroke, useVModel } from '@vueuse/core'
import { computed, nextTick, ref, useAttrs, useId, watch, type ComponentPublicInstance } from 'vue'

import VField from '@/components/ui/VField.vue'
import { cn } from '@/components/ui/utils'

defineOptions({
    inheritAttrs: false,
})

export interface SelectOption {
    label: string
    value: string
    disabled?: boolean
}

interface Props {
    modelValue?: string
    id?: string
    label?: string
    hint?: string
    error?: string
    placeholder?: string
    options?: SelectOption[]
    disabled?: boolean
    required?: boolean
    invalid?: boolean
    rootClass?: string
    selectClass?: string
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: '',
    id: '',
    label: '',
    hint: '',
    error: '',
    placeholder: '',
    options: () => [],
    disabled: false,
    required: false,
    invalid: false,
    rootClass: '',
    selectClass: '',
})

const emit = defineEmits<{
    'update:modelValue': [value: string]
}>()

const attrs = useAttrs()
const model = useVModel(props, 'modelValue', emit)
const selectId = useId()

const rootRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLButtonElement | null>(null)
const optionRefs = ref<(HTMLButtonElement | null)[]>([])
const isOpen = ref(false)
const activeIndex = ref(-1)

interface PanelPosition {
    top: number
    left: number
    width: number
}

const panelPos = ref<PanelPosition>({top: 0, left: 0, width: 0})

const hasError = computed(() => props.invalid || Boolean(props.error))
const selectedOption = computed(() => props.options.find((o) => o.value === model.value) ?? null)
const enabledOptionIndexes = computed(() => (
    props.options
        .map((option, index) => option.disabled ? -1 : index)
        .filter((index) => index >= 0)
))
const triggerLabel = computed(() => selectedOption.value?.label || props.placeholder || 'Select an option')
const showPlaceholder = computed(() => !selectedOption.value && Boolean(props.placeholder))

const triggerClassName = computed(() => cn(
    'trigger-control flex h-[4.4rem] w-full items-center gap-2 px-3 text-body squircle squircle-md border bg-surface-elevated',
    'outline-none focus:outline-none focus-visible:outline-none',
    isOpen.value ? 'is-open' : '',
    props.disabled ? 'is-disabled' : '',
    hasError.value ? 'is-invalid' : '',
    props.selectClass,
))

/** Retrieve a DOM ref for a specific option element */
function setOptionRef(element: Element | ComponentPublicInstance | null, index: number): void {
    optionRefs.value[index] = element instanceof HTMLButtonElement ? element : null
}

function focusActiveOption(): void {
    const el = activeIndex.value >= 0 ? optionRefs.value[activeIndex.value] : null
    el?.focus()
}

function syncActiveIndex(preferredIndex?: number): void {
    const enabledIndexes = enabledOptionIndexes.value

    if (enabledIndexes.length === 0) {
        activeIndex.value = -1
        return
    }

    if (
        typeof preferredIndex === 'number'
        && preferredIndex >= 0
        && !props.options[preferredIndex]?.disabled
    ) {
        activeIndex.value = preferredIndex
        return
    }

    const selectedIndex = props.options.findIndex((o) => o.value === model.value && !o.disabled)
    activeIndex.value = selectedIndex >= 0 ? selectedIndex : (enabledIndexes[0] ?? -1)
}

/** Calculate panel pixel position from trigger bounding rect. 1rem = 10px in this project. */
function updatePanelPos(): void {
    const rect = triggerRef.value?.getBoundingClientRect()

    if (!rect) {
        return
    }

    panelPos.value = {
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
    }
}

async function openDropdown(preferredIndex?: number): Promise<void> {
    if (props.disabled || enabledOptionIndexes.value.length === 0) {
        return
    }

    syncActiveIndex(preferredIndex)
    isOpen.value = true
    await nextTick()
    updatePanelPos()
    focusActiveOption()
}

function closeDropdown(options?: { restoreFocus?: boolean }): void {
    isOpen.value = false
    activeIndex.value = -1

    if (options?.restoreFocus === false) {
        return
    }

    nextTick(() => {
        triggerRef.value?.focus()
    })
}

function toggleDropdown(): void {
    if (isOpen.value) {
        closeDropdown()
        return
    }

    openDropdown()
}

function selectOption(option: SelectOption): void {
    if (option.disabled) {
        return
    }

    model.value = option.value
    closeDropdown()
}

function moveActiveIndex(step: 1 | -1): void {
    const enabledIndexes = enabledOptionIndexes.value

    if (enabledIndexes.length === 0) {
        return
    }

    const currentPosition = enabledIndexes.indexOf(activeIndex.value)
    const nextPosition = currentPosition === -1
        ? 0
        : (currentPosition + step + enabledIndexes.length) % enabledIndexes.length

    activeIndex.value = enabledIndexes[nextPosition] ?? -1
    nextTick(() => {
        focusActiveOption()
    })
}

function handleTriggerKeydown(event: KeyboardEvent): void {
    if (props.disabled) {
        return
    }

    if (event.key === 'ArrowDown') {
        event.preventDefault()
        openDropdown()
        return
    }

    if (event.key === 'ArrowUp') {
        event.preventDefault()
        const lastIndex = enabledOptionIndexes.value[enabledOptionIndexes.value.length - 1]
        openDropdown(lastIndex)
        return
    }

    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        toggleDropdown()
    }
}

function selectActiveOption(event: KeyboardEvent): void {
    event.preventDefault()
    const option = activeIndex.value >= 0 ? props.options[activeIndex.value] : null

    if (option) {
        selectOption(option)
    }
}

function jumpToEdge(event: KeyboardEvent, edge: 'first' | 'last'): void {
    event.preventDefault()
    const indexes = enabledOptionIndexes.value
    activeIndex.value = edge === 'first' ? (indexes[0] ?? -1) : (indexes[indexes.length - 1] ?? -1)
    nextTick(() => {
        focusActiveOption()
    })
}

const LIST_KEY_HANDLERS: Partial<Record<string, (event: KeyboardEvent) => void>> = {
    ArrowDown(e) {
        e.preventDefault();
        moveActiveIndex(1)
    },
    ArrowUp(e) {
        e.preventDefault();
        moveActiveIndex(-1)
    },
    Home(e) {
        jumpToEdge(e, 'first')
    },
    End(e) {
        jumpToEdge(e, 'last')
    },
    Enter: selectActiveOption,
    ' ': selectActiveOption,
}

function handleListKeydown(event: KeyboardEvent): void {
    if (!isOpen.value) {
        return
    }

    LIST_KEY_HANDLERS[event.key]?.(event)
}

watch(() => props.options, () => {
    if (!isOpen.value) {
        return
    }

    syncActiveIndex(activeIndex.value)
}, {deep: true})

watch(() => props.disabled, (disabled) => {
    if (disabled && isOpen.value) {
        closeDropdown({restoreFocus: false})
    }
})

onClickOutside(rootRef, (event) => {
    // Clicks inside the teleported panel must not close the dropdown
    if (panelRef.value?.contains(event.target as Node)) {
        return
    }

    if (isOpen.value) {
        closeDropdown({restoreFocus: false})
    }
})

onKeyStroke('Escape', (event) => {
    if (!isOpen.value) {
        return
    }

    event.preventDefault()
    closeDropdown()
})
</script>

<template>
    <VField
        :id="id"
        :label="label"
        :hint="hint"
        :error="error"
        :required="required"
        :disabled="disabled"
        :invalid="hasError"
        :root-class="rootClass"
    >
        <template #default="{ controlId, describedBy, invalid: fieldInvalid }">
            <div
                ref="rootRef"
                class="relative w-full"
            >
                <input
                    v-if="attrs.name"
                    :name="String(attrs.name)"
                    :value="model"
                    type="hidden"
                >

                <button
                    :id="controlId"
                    ref="triggerRef"
                    v-bind="attrs"
                    type="button"
                    role="combobox"
                    :aria-expanded="isOpen"
                    :aria-controls="`select-listbox-${selectId}`"
                    aria-haspopup="listbox"
                    :aria-describedby="describedBy"
                    :aria-invalid="fieldInvalid || undefined"
                    :aria-activedescendant="isOpen && activeIndex >= 0 ? `select-option-${selectId}-${activeIndex}` : undefined"
                    :disabled="disabled"
                    :class="triggerClassName"
                    @click="toggleDropdown"
                    @keydown="handleTriggerKeydown"
                >
                    <span
                        class="min-w-0 flex-1 truncate text-left"
                        :class="showPlaceholder ? 'text-text-tertiary' : 'text-text-primary'"
                    >
                        {{ triggerLabel }}
                    </span>

                    <span
                        class="inline-flex shrink-0 items-center text-text-tertiary transition-[transform,color] duration-input ease-input"
                        :class="isOpen ? 'rotate-180 text-interactive-primary-default' : ''"
                        aria-hidden="true"
                    >
                        <svg
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            class="size-[1.4rem]"
                        >
                            <path
                                d="M4.5 6.5L8 10L11.5 6.5"
                                stroke="currentColor"
                                stroke-width="1.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                        </svg>
                    </span>
                </button>

                <Teleport to="body">
                    <div
                        v-if="isOpen"
                        :id="`select-listbox-${selectId}`"
                        ref="panelRef"
                        class="fixed z-dropdown overflow-hidden squircle squircle-md border border-border-default bg-surface-elevated p-1.5 shadow-md"
                        :style="{
                            top: `${panelPos.top}px`,
                            left: `${panelPos.left}px`,
                            width: `${panelPos.width}px`,
                        }"
                        role="listbox"
                        :aria-labelledby="controlId"
                        @keydown="handleListKeydown"
                    >
                        <button
                            v-for="(option, index) in options"
                            :id="`select-option-${selectId}-${index}`"
                            :key="option.value"
                            :ref="(el) => setOptionRef(el, index)"
                            type="button"
                            role="option"
                            :aria-selected="model === option.value"
                            :disabled="option.disabled"
                            :tabindex="activeIndex === index ? 0 : -1"
                            :class="cn(
                                'flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-left text-body outline-none',
                                'transition-[background-color,color] duration-fast ease-default',
                                option.disabled
                                    ? 'cursor-not-allowed opacity-45'
                                    : 'cursor-pointer focus:outline-none focus-visible:outline-none',
                                !option.disabled && activeIndex === index
                                    ? 'bg-interactive-primary-default/[0.07]'
                                    : '',
                                !option.disabled && model === option.value
                                    ? 'text-interactive-primary-default'
                                    : 'text-text-primary',
                            )"
                            @click="selectOption(option)"
                            @mouseenter="!option.disabled ? activeIndex = index : undefined"
                        >
                            <span class="truncate">{{ option.label }}</span>

                            <span
                                v-if="model === option.value"
                                class="inline-flex size-[1.8rem] shrink-0 items-center justify-center rounded-full bg-interactive-primary-default/12 text-interactive-primary-default"
                                aria-hidden="true"
                            >
                                <svg
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="size-[1rem]"
                                >
                                    <path
                                        d="M3.5 8.5L6.5 11.5L12.5 5.5"
                                        stroke="currentColor"
                                        stroke-width="1.5"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    />
                                </svg>
                            </span>
                        </button>
                    </div>
                </Teleport>
            </div>
        </template>
    </VField>
</template>

<style scoped>
.trigger-control {
    border-color: var(--color-border-default);
    transition: border-color var(--duration-input) var(--ease-input),
    box-shadow var(--duration-input) var(--ease-input);
}

.trigger-control:hover:not(.is-open, .is-disabled) {
    border-color: var(--color-border-strong);
}

.trigger-control:focus-visible:not(.is-open),
.trigger-control.is-open {
    border-color: var(--color-interactive-primary-default);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-interactive-primary-default) 15%, transparent);
}

.trigger-control.is-disabled {
    border-color: var(--color-border-subtle);
    background-color: var(--color-surface-muted);
    cursor: not-allowed;
}

.trigger-control.is-invalid {
    border-color: var(--color-error-border);
}

.trigger-control.is-invalid:focus-visible,
.trigger-control.is-invalid.is-open {
    border-color: var(--color-error-border);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-error-border) 15%, transparent);
}
</style>
