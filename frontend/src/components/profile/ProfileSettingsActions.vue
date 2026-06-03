<script setup lang="ts">
defineOptions({name: 'ProfileSettingsActions'})

import VSuccessIcon from '@/components/icons/VSuccessIcon.vue'
import {VButton} from '@/components/ui'
import {PROFILE_ACTIONS_TEXTS, PROFILE_SETTINGS_SECTION_TEXTS} from '@/constants/profileViewTexts'

interface Props {
    editing: boolean
    isSaving: boolean
    justSaved: boolean
}

defineProps<Props>()

defineEmits<{
    (e: 'start-edit'): void
    (e: 'cancel'): void
    (e: 'save'): void
}>()
</script>

<template>
    <div
        v-if="!editing"
        class="flex items-center gap-4"
    >
        <transition name="fade">
            <span
                v-if="justSaved"
                class="inline-flex items-center gap-[0.6rem] font-mono text-[1.2rem] text-brand"
            >
                <VSuccessIcon/>
                {{ PROFILE_SETTINGS_SECTION_TEXTS.savedToast }}
            </span>
        </transition>
        <VButton
            variant="secondary"
            size="sm"
            shape="rect"
            @click="$emit('start-edit')"
        >
            {{ PROFILE_ACTIONS_TEXTS.edit }}
        </VButton>
    </div>

    <div
        v-else
        class="flex items-center gap-[0.8rem]"
    >
        <VButton
            variant="ghost"
            size="sm"
            shape="rect"
            :disabled="isSaving"
            @click="$emit('cancel')"
        >
            {{ PROFILE_ACTIONS_TEXTS.cancel }}
        </VButton>
        <VButton
            size="sm"
            shape="rect"
            :loading="isSaving"
            @click="$emit('save')"
        >
            {{ PROFILE_ACTIONS_TEXTS.apply }}
        </VButton>
    </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 300ms ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>