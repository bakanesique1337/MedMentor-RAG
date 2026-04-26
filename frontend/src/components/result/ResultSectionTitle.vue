<script setup lang="ts">
defineOptions({ name: 'ResultSectionTitle' })
</script>

<template>
    <h3 class="mt-0 mb-[1rem] font-mono text-[1.05rem] font-semibold uppercase tracking-[0.16em] text-text-secondary">
        <slot />
    </h3>
</template>
