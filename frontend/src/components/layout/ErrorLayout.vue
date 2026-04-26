<script setup lang="ts">
import PageTransition from '@/components/common/PageTransition.vue'
import TheHeader from '@/components/layout/TheHeader/TheHeader.vue'
</script>

<template>
    <div
        data-layout="error"
        class="flex min-h-screen flex-col"
    >
        <TheHeader variant="error" />

        <main class="relative flex flex-1 flex-col">
            <PageTransition />
        </main>
    </div>
</template>
