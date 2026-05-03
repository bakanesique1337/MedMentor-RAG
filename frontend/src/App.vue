<script setup lang="ts">
import {RouterView} from 'vue-router'
</script>

<template>
    <div class="relative min-h-screen overflow-x-hidden">
        <RouterView v-slot="{ Component, route }">
            <Transition
                name="page"
                mode="default"
            >
                <component
                    :is="Component"
                    :key="route.meta.layout || 'root'"
                />
            </Transition>
        </RouterView>
    </div>
</template>
