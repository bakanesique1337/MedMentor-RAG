<script setup lang="ts">
import TheFooter from '@/components/layout/TheFooter/TheFooter.vue'
import TheHeader from '@/components/layout/TheHeader/TheHeader.vue'
</script>

<template>
    <div
        data-layout="app"
        class="flex min-h-screen flex-col"
    >
        <TheHeader variant="app" />

        <main class="flex flex-1 flex-col">
            <RouterView />
        </main>

        <TheFooter variant="app" />
    </div>
</template>
