<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
    <RouterView v-slot="{ Component, route }">
        <Transition
            name="layout"
            mode="out-in"
        >
            <component
                :is="Component"
                :key="route.meta.layout ?? 'root'"
            />
        </Transition>
    </RouterView>
</template>

<style scoped>
.layout-enter-active,
.layout-leave-active {
    transition: opacity 200ms var(--ease-soft);
    will-change: opacity;
}

.layout-enter-from,
.layout-leave-to {
    opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
    .layout-enter-active,
    .layout-leave-active {
        transition-duration: 100ms;
    }
}
</style>
