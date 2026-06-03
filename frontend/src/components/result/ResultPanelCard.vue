<script setup lang="ts">
defineOptions({name: 'ResultPanelCard'})

type Padding = 'tight' | 'tight-y' | 'cozy'

interface Props {
    padding?: Padding
}

const {padding = 'cozy'} = defineProps<Props>()

const PADDING_CLASS: Record<Padding, string> = {
    'tight': 'p-[0.4rem]',
    'tight-y': 'py-[0.4rem]',
    'cozy': 'px-[1.8rem] py-[1.4rem]',
}
</script>

<template>
    <div
        class="mb-[2.4rem] rounded-[1.2rem] border border-(--color-line) bg-white"
        :class="PADDING_CLASS[padding]"
    >
        <slot/>
    </div>
</template>