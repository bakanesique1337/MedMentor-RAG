<script setup lang="ts">
import VChevronIcon from '@/components/icons/VChevronIcon.vue'
import VIconButton from '@/components/ui/VIconButton.vue'

const LABELS = {
    logoAlt: 'МедМентор RAG',
    wordmark: 'МедМентор',
    subtitle: 'RAG · Тренажер',
    collapseAriaLabel: 'Свернуть меню',
    expandAriaLabel: 'Развернуть меню',
} as const

interface Props {
    collapsible?: boolean
    collapsed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    collapsible: false,
    collapsed: false,
})

const emit = defineEmits<{
    'update:collapsed': [value: boolean]
}>()

function handleToggle(value: boolean): void {
    if (!props.collapsible) return
    emit('update:collapsed', value)
}
</script>

<template>
    <div
        class="flex items-center gap-4 border-b border-dark-line px-[1.6rem] py-[1.4rem]"
        :class="collapsible && collapsed ? 'justify-center px-0' : ''"
    >
        <div
            class="logo-tile flex size-[3.2rem] shrink-0 items-center justify-center overflow-hidden rounded-sm"
        >
            <img
                src="/MM1_64.png"
                :alt="LABELS.logoAlt"
                width="32"
                height="32"
                class="size-[3.2rem] object-contain"
            >
        </div>

        <template v-if="!(collapsible && collapsed)">
            <div class="min-w-0 flex-1">
                <div class="text-[1.3rem] font-semibold leading-tight tracking-[-0.01em] text-dark-ink">
                    {{ LABELS.wordmark }}
                </div>
                <div class="text-eyebrow-sm text-dark-teal">
                    {{ LABELS.subtitle }}
                </div>
            </div>

            <VIconButton
                v-if="collapsible"
                variant="ghost-dark"
                size="md"
                :aria-label="LABELS.collapseAriaLabel"
                @click="handleToggle(true)"
            >
                <VChevronIcon class="rotate-180"/>
            </VIconButton>
        </template>
    </div>

    <div
        v-if="collapsible && collapsed"
        class="flex flex-col items-center gap-[0.6rem] py-[1.2rem]"
    >
        <VIconButton
            variant="ghost-dark"
            size="lg"
            :aria-label="LABELS.expandAriaLabel"
            @click="handleToggle(false)"
        >
            <VChevronIcon/>
        </VIconButton>
    </div>
</template>

<style scoped>
.logo-tile {
    background: linear-gradient(135deg, var(--color-dark-teal), var(--color-teal-deep));
    box-shadow: 0 0 0 1px rgb(63 185 179 / 35%), 0 4px 12px rgb(63 185 179 / 20%);
}
</style>
