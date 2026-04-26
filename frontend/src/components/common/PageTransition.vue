<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
    <RouterView v-slot="{ Component, route }">
        <Transition
            name="page"
            mode="out-in"
        >
            <component
                :is="Component"
                :key="route.path"
            />
        </Transition>
    </RouterView>
</template>

<style scoped>
.page-enter-active,
.page-leave-active {
    transition: opacity 180ms var(--ease-soft);
    will-change: opacity;
}

.page-enter-from,
.page-leave-to {
    opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
    .page-enter-active,
    .page-leave-active {
        transition-duration: 100ms;
    }
}
</style>
