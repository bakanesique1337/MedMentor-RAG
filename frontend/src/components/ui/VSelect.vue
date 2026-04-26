<script setup lang="ts">
import { onClickOutside, onKeyStroke, useVModel } from '@vueuse/core'
import { computed, nextTick, ref, useAttrs, useId, watch } from 'vue'

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
const triggerRef = ref<HTMLButtonElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)

interface PanelPos {
    top: number
    left: number
    width: number
}

const panelPos = ref<PanelPos>({ top: 0, left: 0, width: 0 })
const hasError = computed(() => props.invalid || Boolean(props.error))
const selected = computed(() => props.options.find((o) => o.value === model.value) ?? null)
const showPlaceholder = computed(() => !selected.value && Boolean(props.placeholder))
const DEFAULT_PLACEHOLDER = 'Выбрать'

const triggerLabel = computed(() => selected.value?.label || props.placeholder || DEFAULT_PLACEHOLDER)

const triggerClass = computed(() =>
    cn(
        'flex h-[4rem] w-full items-center gap-[0.8rem] rounded-[1rem] border px-[1.2rem] text-[1.35rem] transition',
        hasError.value
            ? 'border-[color:var(--color-danger-bright)]'
            : 'border-[color:var(--color-line-2)] hover:border-[color:var(--color-ink-3)]',
        isOpen.value ? 'border-brand bg-white' : 'bg-surface-base',
        props.disabled ? 'opacity-60 cursor-not-allowed' : '',
        props.selectClass,
    ),
)

function updatePanelPos(): void {
    const rect = triggerRef.value?.getBoundingClientRect()
    if (!rect) return
    panelPos.value = { top: rect.bottom + 6, left: rect.left, width: rect.width }
}

async function openPanel(): Promise<void> {
    if (props.disabled) return
    isOpen.value = true
    await nextTick()
    updatePanelPos()
}

function closePanel(): void {
    isOpen.value = false
}

function toggle(): void {
    if (isOpen.value) closePanel()
    else openPanel()
}

function selectOption(option: SelectOption): void {
    if (option.disabled) return
    model.value = option.value
    closePanel()
    nextTick(() => triggerRef.value?.focus())
}

watch(() => props.disabled, (d) => {
    if (d && isOpen.value) closePanel()
})

onClickOutside(rootRef, (event) => {
    if (panelRef.value?.contains(event.target as Node)) return
    if (isOpen.value) closePanel()
})

onKeyStroke('Escape', (event) => {
    if (!isOpen.value) return
    event.preventDefault()
    closePanel()
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
                    type="button"
                    :aria-expanded="isOpen"
                    :aria-haspopup="true"
                    :aria-describedby="describedBy"
                    :aria-invalid="fieldInvalid || undefined"
                    :disabled="disabled"
                    :class="triggerClass"
                    @click="toggle"
                >
                    <span
                        class="min-w-0 flex-1 truncate text-left"
                        :class="showPlaceholder ? 'text-text-tertiary' : 'text-text-primary'"
                    >
                        {{ triggerLabel }}
                    </span>
                    <span
                        class="inline-flex shrink-0 items-center text-text-tertiary transition"
                        :class="isOpen ? 'rotate-180 text-brand' : ''"
                        aria-hidden="true"
                    >
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            fill="none"
                        ><path
                            d="M4 5.5l3 3 3-3"
                            stroke="currentColor"
                            stroke-width="1.4"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        /></svg>
                    </span>
                </button>

                <Teleport to="body">
                    <div
                        v-if="isOpen"
                        :id="`select-listbox-${selectId}`"
                        ref="panelRef"
                        role="listbox"
                        class="fixed z-[90] overflow-hidden rounded-[1rem] border border-[color:var(--color-line-2)] bg-white p-[0.6rem] shadow-[0_20px_40px_-20px_rgb(10_31_31_/_0.3)]"
                        :style="{
                            top: `${panelPos.top}px`,
                            left: `${panelPos.left}px`,
                            width: `${panelPos.width}px`,
                        }"
                    >
                        <button
                            v-for="option in options"
                            :key="option.value"
                            type="button"
                            role="option"
                            :aria-selected="model === option.value"
                            :disabled="option.disabled"
                            :class="cn(
                                'flex w-full items-center justify-between gap-[1rem] rounded-[0.6rem] px-[1.2rem] py-[0.8rem] text-left text-[1.35rem]',
                                option.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-brand-faint',
                                model === option.value ? 'text-brand font-medium' : 'text-text-primary',
                            )"
                            @click="selectOption(option)"
                        >
                            <span class="truncate">{{ option.label }}</span>
                            <span
                                v-if="model === option.value"
                                class="text-brand"
                                aria-hidden="true"
                            >
                                <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 12 12"
                                    fill="none"
                                ><path
                                    d="M2 6l3 3 5-6"
                                    stroke="currentColor"
                                    stroke-width="1.6"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                /></svg>
                            </span>
                        </button>
                    </div>
                </Teleport>
            </div>
        </template>
    </VField>
</template>
