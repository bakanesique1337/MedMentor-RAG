<script setup lang="ts">
import {onMounted} from 'vue'
import {useRouter} from 'vue-router'

import ProfileAccuracyDonut from '@/components/profile/ProfileAccuracyDonut.vue'
import ProfileActivityChart from '@/components/profile/ProfileActivityChart.vue'
import ProfileHero from '@/components/profile/ProfileHero.vue'
import ProfileRecentCases from '@/components/profile/ProfileRecentCases.vue'
import ProfileSectionHeader from '@/components/profile/ProfileSectionHeader.vue'
import ProfileSettingsActions from '@/components/profile/ProfileSettingsActions.vue'
import ProfileSettingsCard from '@/components/profile/ProfileSettingsCard.vue'
import ProfileSpecialtyBars from '@/components/profile/ProfileSpecialtyBars.vue'
import ProfileStatBig from '@/components/profile/ProfileStatBig.vue'
import ProfileStatProgress from '@/components/profile/ProfileStatProgress.vue'
import ProfileStatSparkline from '@/components/profile/ProfileStatSparkline.vue'
import {VAlert, VButton, VSkeleton} from '@/components/ui'
import {useProfileData} from '@/composables/profile/useProfileData'
import {useProfileForm} from '@/composables/profile/useProfileForm'
import {useProfileStats} from '@/composables/profile/useProfileStats'
import {
    PROFILE_ACTIONS_TEXTS,
    PROFILE_ALERTS_TEXTS,
    PROFILE_SETTINGS_SECTION_TEXTS,
    PROFILE_STATS_CARD_TEXTS,
    PROFILE_STATS_SECTION_TEXTS,
} from '@/constants/profileViewTexts'
import {ROUTES} from '@/constants/routes'
import {useAuthGateStore} from '@/stores/authGate'

const router = useRouter()
const authGate = useAuthGateStore()

const {
    userSettings,
    stats,
    historyList,
    casesList,
    isLoading,
    loadError,
    fetchProfileData,
} = useProfileData()

const {
    totalCases,
    completedCount,
    completedChip,
    averageScore,
    streak,
    streakChip,
    practiceHours,
    activity30d,
    streakSparkline,
    practiceSparkline,
    accuracyBuckets,
    specialtyRows,
} = useProfileStats({historyList, casesList, stats})

const {
    formState,
    editing,
    isSaving,
    saveError,
    justSaved,
    settingsAnchor,
    fullName,
    heroRole,
    heroFacultyLine,
    heroUniversity,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleFormUpdate,
} = useProfileForm({userSettings})

function handleOpenSession(sessionId: number): void {
    router.push({name: ROUTES.RESULT, params: {sessionId: String(sessionId)}})
        .catch(() => undefined)
}

function handleOpenCases(): void {
    router.push({name: ROUTES.CASES}).catch(() => undefined)
}

async function handleLogout(): Promise<void> {
    await authGate.logout()
    await router.push({name: ROUTES.HOME})
}

onMounted(async () => {
    await fetchProfileData()
})
</script>

<template>
    <div class="flex h-full flex-col overflow-hidden">
        <header
            class="flex shrink-0 items-center justify-end border-b border-(--color-line) bg-white px-[2.8rem] py-[1.4rem]"
        >
            <VButton
                variant="secondary"
                size="sm"
                shape="rect"
                :disabled="authGate.isLogoutPending"
                @click="handleLogout"
            >
                {{ PROFILE_ACTIONS_TEXTS.logout }}
            </VButton>
        </header>

        <div class="flex-1 overflow-y-auto">
            <template v-if="isLoading">
                <div class="mx-auto flex w-full max-w-480 flex-col gap-[1.6rem] px-[2.4rem] py-[3.6rem]">
                    <VSkeleton height="14rem"/>
                    <VSkeleton height="22rem"/>
                    <VSkeleton height="32rem"/>
                </div>
            </template>

            <template v-else-if="loadError">
                <div class="mx-auto w-full max-w-480 px-[2.4rem] py-[3.6rem]">
                    <VAlert
                        status="error"
                        :title="PROFILE_ALERTS_TEXTS.loadErrorTitle"
                        :description="loadError"
                    />
                </div>
            </template>

            <template v-else>
                <ProfileHero
                    :name="fullName"
                    :role="heroRole"
                    :faculty-line="heroFacultyLine"
                    :university="heroUniversity"
                    :avatar-variant="formState.avatarVariant"
                    @edit="handleStartEdit(true)"
                />

                <div class="mx-auto w-full max-w-480 px-[2.4rem] pb-32 pt-[2.4rem]">
                    <!-- Section: Stats -->
                    <ProfileSectionHeader
                        :eyebrow="PROFILE_STATS_SECTION_TEXTS.eyebrow"
                        :title="PROFILE_STATS_SECTION_TEXTS.title"
                        :hint="PROFILE_STATS_SECTION_TEXTS.hint"
                    />

                    <div class="mb-[1.8rem] grid grid-cols-1 gap-[1.4rem] sm:grid-cols-2 lg:grid-cols-4">
                        <ProfileStatBig
                            :label="PROFILE_STATS_CARD_TEXTS.completedLabel"
                            :value="String(completedCount)"
                            :sub="totalCases > 0 ? `/ ${totalCases}` : undefined"
                            :chip="completedChip || undefined"
                            chip-tone="teal"
                        >
                            <template #footer>
                                <ProfileStatProgress
                                    :value="completedCount"
                                    :max="totalCases || 1"
                                />
                            </template>
                        </ProfileStatBig>

                        <ProfileStatBig
                            :label="PROFILE_STATS_CARD_TEXTS.averageLabel"
                            :value="String(averageScore)"
                            :sub="PROFILE_STATS_CARD_TEXTS.scoreOutOf"
                        >
                            <template #footer>
                                <ProfileStatProgress
                                    :value="averageScore"
                                    :max="100"
                                />
                            </template>
                        </ProfileStatBig>

                        <ProfileStatBig
                            :label="PROFILE_STATS_CARD_TEXTS.streakLabel"
                            :value="String(streak)"
                            :sub="PROFILE_STATS_CARD_TEXTS.streakUnit"
                            :chip="streakChip"
                            chip-tone="amber"
                        >
                            <template #footer>
                                <ProfileStatSparkline
                                    :data="streakSparkline"
                                    color="var(--color-amber)"
                                />
                            </template>
                        </ProfileStatBig>

                        <ProfileStatBig
                            :label="PROFILE_STATS_CARD_TEXTS.practiceLabel"
                            :value="String(practiceHours)"
                            :sub="PROFILE_STATS_CARD_TEXTS.practiceUnit"
                            :chip="PROFILE_STATS_CARD_TEXTS.practiceChip"
                        >
                            <template #footer>
                                <ProfileStatSparkline :data="practiceSparkline"/>
                            </template>
                        </ProfileStatBig>
                    </div>

                    <div class="mb-[1.8rem]">
                        <ProfileActivityChart :data="activity30d"/>
                    </div>

                    <div class="mb-[1.8rem] grid grid-cols-1 gap-[1.4rem] lg:grid-cols-2">
                        <ProfileAccuracyDonut :buckets="accuracyBuckets"/>
                        <ProfileSpecialtyBars :items="specialtyRows"/>
                    </div>

                    <div class="mb-[3.6rem]">
                        <ProfileRecentCases
                            :items="historyList"
                            @open="handleOpenSession"
                            @open-all="handleOpenCases"
                        />
                    </div>

                    <!-- Section: Settings -->
                    <div
                        ref="settingsAnchor"
                        class="scroll-mt-[2.4rem]"
                    >
                        <ProfileSectionHeader
                            :eyebrow="PROFILE_SETTINGS_SECTION_TEXTS.eyebrow"
                            :title="PROFILE_SETTINGS_SECTION_TEXTS.title"
                            :hint="PROFILE_SETTINGS_SECTION_TEXTS.hint"
                        >
                            <template #action>
                                <ProfileSettingsActions
                                    :editing="editing"
                                    :is-saving="isSaving"
                                    :just-saved="justSaved"
                                    @start-edit="handleStartEdit(false)"
                                    @cancel="handleCancelEdit"
                                    @save="handleSaveEdit"
                                />
                            </template>
                        </ProfileSectionHeader>

                        <VAlert
                            v-if="saveError"
                            status="error"
                            :description="saveError"
                            class="mb-[1.4rem]"
                        />

                        <ProfileSettingsCard
                            :form="formState"
                            :editing="editing"
                            :full-name="fullName"
                            @update:form="handleFormUpdate"
                        />
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>
