<script setup lang="ts">
import TheHeader from '@/components/layout/TheHeader/TheHeader.vue'
</script>

<template>
    <div
        data-layout="error"
        class="flex min-h-screen flex-col"
    >
        <TheHeader variant="error" />

        <main class="flex-1">
            <RouterView />
        </main>
    </div>
</template>
