<script setup lang="ts">
interface Props {
    tone?: 'brand' | 'mint' | 'ink' | 'muted'
    withDot?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    tone: 'brand',
    withDot: false,
})

const toneClass: Record<NonNullable<Props['tone']>, string> = {
    brand: 'text-brand',
    mint: 'text-brand-mint',
    ink: 'text-text-primary',
    muted: 'text-text-tertiary',
}

const dotClass: Record<NonNullable<Props['tone']>, string> = {
    brand: 'bg-brand',
    mint: 'bg-brand-mint',
    ink: 'bg-text-primary',
    muted: 'bg-text-tertiary',
}
</script>

<template>
    <span
        class="inline-flex items-center gap-[0.8rem] text-eyebrow"
        :class="toneClass[props.tone]"
    >
        <span
            v-if="withDot"
            class="inline-block h-[0.6rem] w-[0.6rem] rounded-full anim-blink"
            :class="dotClass[props.tone]"
        />
        <slot />
    </span>
</template>
