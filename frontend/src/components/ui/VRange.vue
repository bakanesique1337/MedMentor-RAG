<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { computed, useAttrs } from 'vue'

import VField from '@/components/ui/VField.vue'
import { cn } from '@/components/ui/utils'

defineOptions({
    inheritAttrs: false,
})

interface Props {
    modelValue?: number
    id?: string
    label?: string
    hint?: string
    error?: string
    min?: number
    max?: number
    step?: number
    disabled?: boolean
    invalid?: boolean
    valueSuffix?: string
    rootClass?: string
    inputClass?: string
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: 0,
    id: '',
    label: '',
    hint: '',
    error: '',
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
    invalid: false,
    valueSuffix: '',
    rootClass: '',
    inputClass: '',
})

const emit = defineEmits<{
    'update:modelValue': [value: number]
}>()

const attrs = useAttrs()
const model = useVModel(props, 'modelValue', emit)
const hasError = computed(() => props.invalid || Boolean(props.error))

function onInput(event: Event): void {
    const target = event.target as HTMLInputElement
    model.value = Number(target.value)
}

const fillPercent = computed(() => {
    const range = props.max - props.min
    if (range <= 0) return 0
    const ratio = (model.value - props.min) / range
    return Math.max(0, Math.min(100, ratio * 100))
})

const rangeStyle = computed(() => ({
    '--mm-range-fill': `${fillPercent.value}%`,
}))

const rangeClass = computed(() =>
    cn(
        'mm-range min-w-0 flex-1 cursor-pointer outline-none',
        props.disabled ? 'cursor-not-allowed opacity-60' : '',
        props.inputClass,
    ),
)
</script>

<template>
    <VField
        :id="id"
        :label="label"
        :hint="hint"
        :error="error"
        :disabled="disabled"
        :invalid="hasError"
        :root-class="rootClass"
    >
        <template #default="{ controlId, describedBy, invalid: fieldInvalid }">
            <div class="flex items-center gap-[1.2rem]">
                <input
                    :id="controlId"
                    v-bind="attrs"
                    type="range"
                    :value="model"
                    :min="min"
                    :max="max"
                    :step="step"
                    :disabled="disabled"
                    :aria-describedby="describedBy"
                    :aria-invalid="fieldInvalid || undefined"
                    :class="rangeClass"
                    :style="rangeStyle"
                    @input="onInput"
                >
                <div class="w-[5.2rem] text-right font-mono text-[1.4rem] font-semibold tabular text-brand">
                    {{ model }}{{ valueSuffix }}
                </div>
            </div>
        </template>
    </VField>
</template>

<style scoped>
.mm-range {
    height: 1.4rem;
    padding: 0;
    background: transparent;
    appearance: none;
}

.mm-range::-webkit-slider-runnable-track {
    height: 1rem;
    border-radius: 999px;
    background:
        linear-gradient(
            to right,
            var(--color-teal-deep) 0%,
            var(--color-teal-deep) var(--mm-range-fill, 0%),
            var(--color-line-2) var(--mm-range-fill, 0%),
            var(--color-line-2) 100%
        );
}

.mm-range::-moz-range-track {
    height: 1rem;
    border-radius: 999px;
    background: var(--color-line-2);
}

.mm-range::-moz-range-progress {
    height: 1rem;
    border-radius: 999px;
    background: var(--color-teal-deep);
}

.mm-range::-webkit-slider-thumb {
    appearance: none;
    width: 2.4rem;
    height: 1.4rem;
    margin-top: -0.2rem;
    border-radius: 999px;
    border: 0.15rem solid var(--color-line-2);
    background: #fff;
    box-shadow: 0 0.1rem 0.3rem rgb(10 31 31 / 12%);
}

.mm-range::-moz-range-thumb {
    width: 2.4rem;
    height: 1.4rem;
    border-radius: 999px;
    border: 0.15rem solid var(--color-line-2);
    background: #fff;
    box-shadow: 0 0.1rem 0.3rem rgb(10 31 31 / 12%);
}

.mm-range:focus-visible::-webkit-slider-thumb {
    outline: 0.2rem solid var(--color-teal);
    outline-offset: 0.2rem;
}

.mm-range:focus-visible::-moz-range-thumb {
    outline: 0.2rem solid var(--color-teal);
    outline-offset: 0.2rem;
}
</style>
