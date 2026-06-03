<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
    <RouterView v-slot="{ Component, route }">
        <Transition
            name="page"
            mode="default"
        >
            <component
                :is="Component"
                :key="route.fullPath"
            />
        </Transition>
    </RouterView>
</template>
