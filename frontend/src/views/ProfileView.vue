<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import ProfileAccuracyDonut from '@/components/profile/ProfileAccuracyDonut.vue'
import ProfileActivityChart from '@/components/profile/ProfileActivityChart.vue'
import ProfileHero from '@/components/profile/ProfileHero.vue'
import ProfileRecentCases from '@/components/profile/ProfileRecentCases.vue'
import ProfileSectionHeader from '@/components/profile/ProfileSectionHeader.vue'
import ProfileSettingsCard from '@/components/profile/ProfileSettingsCard.vue'
import ProfileSpecialtyBars from '@/components/profile/ProfileSpecialtyBars.vue'
import ProfileStatBig from '@/components/profile/ProfileStatBig.vue'
import ProfileStatProgress from '@/components/profile/ProfileStatProgress.vue'
import ProfileStatSparkline from '@/components/profile/ProfileStatSparkline.vue'
import { VAlert, VButton, VSkeleton } from '@/components/ui'
import { useCasesApi } from '@/composables/useCasesApi'
import { useProfileApi } from '@/composables/useProfileApi'
import { ROUTES } from '@/constants/routes'
import { useAuthGateStore } from '@/stores/authGate'
import type {
    AvatarVariant,
    CaseCard,
    HistorySession,
    ProfileRole,
    SimulationStatsOverview,
    UpdateUserSettingsRequest,
    UserSettings,
} from '@/types'
import {
    compute30DayActivity,
    computeAccuracyBuckets,
    computePracticeMinutes,
    computeSpecialtyBreakdown,
    computeStreak,
    totalCasesCount,
} from '@/utils/profileAggregations'

const STREAK_GOAL = 14
const SPARKLINE_WINDOW = 14
const SUCCESS_TOAST_DURATION_MS = 2400

const COPY = {
    logoutButton: 'Выйти из аккаунта',
    loadErrorTitle: 'Не удалось загрузить профиль',
    statsEyebrow: 'Обзор',
    statsTitle: 'Статистика',
    statsHint: 'Ваш прогресс и активность',
    completedLabel: 'Завершено',
    averageLabel: 'Средний балл',
    streakLabel: 'Серия',
    streakUnit: 'дней',
    practiceLabel: 'Практика',
    practiceUnit: 'ч.',
    practiceChip: 'ЗА МЕСЯЦ',
    scoreOutOf: '/100',
    settingsEyebrow: 'Настройки',
    settingsTitle: 'Аккаунт',
    settingsHint: 'Персональные данные',
    savedToast: 'Изменения сохранены',
    editButton: 'Редактировать',
    cancelButton: 'Отмена',
    applyButton: 'Применить',
    fallbackName: 'Резидент',
    fallbackRole: 'Профиль',
    fallbackFaculty: 'Заполните данные о роли',
    fallbackUniversity: 'Учебное заведение не указано',
} as const

interface ProfileFormState {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    course: string;
    faculty: string;
    university: string;
    avatarVariant: AvatarVariant;
}

const router = useRouter()
const profileApi = useProfileApi()
const casesApi = useCasesApi()
const authGate = useAuthGateStore()

const userSettings = ref<UserSettings | null>(null)
const stats = ref<SimulationStatsOverview | null>(null)
const historyList = ref<HistorySession[]>([])
const casesList = ref<CaseCard[]>([])

const isLoading = ref(true)
const loadError = ref<string | null>(null)

const editing = ref(false)
const isSaving = ref(false)
const saveError = ref<string | null>(null)
const justSaved = ref(false)

const settingsAnchor = ref<HTMLElement | null>(null)

let savedSnapshot: ProfileFormState | null = null
let toastTimer: ReturnType<typeof setTimeout> | null = null

const formState = ref<ProfileFormState>({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    course: '',
    faculty: '',
    university: '',
    avatarVariant: 'teal',
})

// ---------------------------------------------------------------------------
// Derived profile / hero copy
// ---------------------------------------------------------------------------

const fullName = computed<string>(() => {
    const composed = `${formState.value.firstName} ${formState.value.lastName}`.trim()
    if (composed) return composed
    return userSettings.value?.displayName ?? authGate.displayName ?? COPY.fallbackName
})

const heroRole = computed<string>(() => formState.value.role || COPY.fallbackRole)

const heroFacultyLine = computed<string>(() => {
    const parts: string[] = []
    if (formState.value.course) parts.push(formState.value.course)
    if (formState.value.faculty) parts.push(formState.value.faculty)
    return parts.join(' · ') || COPY.fallbackFaculty
})

const heroUniversity = computed<string>(() => formState.value.university || COPY.fallbackUniversity)

// ---------------------------------------------------------------------------
// Aggregations
// ---------------------------------------------------------------------------

const categoryTotals = computed<Map<string, number>>(() => {
    const map = new Map<string, number>()
    casesList.value.forEach((c) => {
        map.set(c.category, (map.get(c.category) ?? 0) + 1)
    })
    return map
})

const totalCases = computed<number>(() => totalCasesCount(categoryTotals.value))

const completedCount = computed<number>(() => stats.value?.completedSessions ?? 0)

const completedChip = computed<string>(() => {
    if (totalCases.value === 0) return ''
    return `${Math.round((completedCount.value / totalCases.value) * 100)}%`
})

const averageScore = computed<number>(() => {
    const fromStats = stats.value?.averageTotalScore
    if (typeof fromStats === 'number') return Math.round(fromStats * 100)
    return 0
})

const streak = computed<number>(() => computeStreak(historyList.value))

const practiceMinutes = computed<number>(() => computePracticeMinutes(historyList.value))

const practiceHours = computed<number>(() => Math.round(practiceMinutes.value / 60))

const activity30d = computed(() => compute30DayActivity(historyList.value))

const streakSparkline = computed<number[]>(() =>
    activity30d.value.slice(-SPARKLINE_WINDOW).map((day) => (day.minutes > 0 ? 1 : 0)),
)

const practiceSparkline = computed<number[]>(() =>
    activity30d.value.slice(-SPARKLINE_WINDOW).map((day) => day.minutes),
)

const accuracyBuckets = computed(() => computeAccuracyBuckets(historyList.value))

const specialtyRows = computed(() => computeSpecialtyBreakdown(historyList.value, categoryTotals.value))

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

/**
 * Loads settings, stats, history, and cases in parallel and seeds the edit form.
 */
async function fetchProfileData(): Promise<void> {
    isLoading.value = true
    loadError.value = null

    try {
        const [settingsResult, statsResult, historyResult, casesResult] = await Promise.all([
            profileApi.settings(),
            profileApi.stats(),
            profileApi.history(),
            casesApi.getCases(),
        ])

        userSettings.value = settingsResult
        stats.value = statsResult
        historyList.value = historyResult
        casesList.value = casesResult
        seedFormFromSettings(settingsResult)
    } catch {
        loadError.value = 'Не удалось загрузить профиль. Попробуйте обновить страницу.'
    } finally {
        isLoading.value = false
    }
}

/**
 * Resets the editable form state from the latest server-side settings.
 * Splits displayName into first/last only when no first/last are stored yet.
 */
function seedFormFromSettings(settings: UserSettings): void {
    const fallback = splitDisplayName(settings.displayName)
    formState.value = {
        firstName: settings.firstName ?? fallback.firstName,
        lastName: settings.lastName ?? fallback.lastName,
        email: settings.email ?? '',
        role: settings.role ?? '',
        course: settings.course ?? '',
        faculty: settings.faculty ?? '',
        university: settings.university ?? '',
        avatarVariant: settings.avatarVariant ?? 'teal',
    }
}

function splitDisplayName(name: string): { firstName: string; lastName: string } {
    const parts = name.trim().split(/\s+/).filter((p) => p.length > 0)
    const first = parts[0] ?? ''
    const last = parts.length > 1 ? parts.slice(1).join(' ') : ''
    return { firstName: first, lastName: last }
}

// ---------------------------------------------------------------------------
// Edit lifecycle
// ---------------------------------------------------------------------------

/**
 * Enters edit mode and snapshots the current form for cancel.
 * Optionally scrolls the settings section into view (used by the hero CTA).
 */
function handleStartEdit(scrollIntoView = false): void {
    if (editing.value) {
        if (scrollIntoView) scrollToSettings()
        return
    }
    savedSnapshot = { ...formState.value }
    editing.value = true
    saveError.value = null
    justSaved.value = false
    if (scrollIntoView) {
        nextTick(() => scrollToSettings())
    }
}

function handleCancelEdit(): void {
    if (savedSnapshot) {
        formState.value = { ...savedSnapshot }
        savedSnapshot = null
    }
    editing.value = false
    saveError.value = null
}

/**
 * Sends the edited form to the backend, syncs local state on success, and
 * surfaces a transient confirmation toast.
 */
async function handleSaveEdit(): Promise<void> {
    if (!userSettings.value || isSaving.value) return

    isSaving.value = true
    saveError.value = null

    const composedDisplayName =
        `${formState.value.firstName} ${formState.value.lastName}`.trim()
        || userSettings.value.displayName

    const payload: UpdateUserSettingsRequest = {
        displayName: composedDisplayName,
        firstName: nullify(formState.value.firstName),
        lastName: nullify(formState.value.lastName),
        email: nullify(formState.value.email),
        role: (nullify(formState.value.role) as ProfileRole | null) ?? null,
        course: nullify(formState.value.course),
        faculty: nullify(formState.value.faculty),
        university: nullify(formState.value.university),
        avatarVariant: formState.value.avatarVariant,
        settings: userSettings.value.settings,
    }

    try {
        const updated = await profileApi.updateSettings(payload)
        userSettings.value = updated
        seedFormFromSettings(updated)
        savedSnapshot = null
        editing.value = false
        showSuccessToast()
    } catch {
        saveError.value = 'Не удалось сохранить изменения. Попробуйте снова.'
    } finally {
        isSaving.value = false
    }
}

function nullify(value: string): string | null {
    const trimmed = value.trim()
    return trimmed === '' ? null : trimmed
}

function showSuccessToast(): void {
    justSaved.value = true
    if (toastTimer !== null) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
        justSaved.value = false
        toastTimer = null
    }, SUCCESS_TOAST_DURATION_MS)
}

function scrollToSettings(): void {
    const element = settingsAnchor.value
    if (!element) return
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ---------------------------------------------------------------------------
// Form sync from child component
// ---------------------------------------------------------------------------

function handleFormUpdate(next: ProfileFormState): void {
    formState.value = next
}

// ---------------------------------------------------------------------------
// Navigation handlers
// ---------------------------------------------------------------------------

function handleOpenSession(sessionId: number): void {
    router.push({ name: ROUTES.RESULT, params: { sessionId: String(sessionId) } })
        .catch(() => undefined)
}

function handleOpenCases(): void {
    router.push({ name: ROUTES.CASES }).catch(() => undefined)
}

async function handleLogout(): Promise<void> {
    await authGate.logout()
    await router.push({ name: ROUTES.HOME })
}

// ---------------------------------------------------------------------------
// Mount
// ---------------------------------------------------------------------------

onMounted(async () => {
    await fetchProfileData()
})
</script>

<template>
    <div class="flex h-full flex-col overflow-hidden">
        <header class="flex shrink-0 items-center justify-end border-b border-[color:var(--color-line)] bg-white px-[2.8rem] py-[1.4rem]">
            <VButton
                variant="secondary"
                size="sm"
                shape="rect"
                :disabled="authGate.isLogoutPending"
                @click="handleLogout"
            >
                {{ COPY.logoutButton }}
            </VButton>
        </header>

        <div class="flex-1 overflow-y-auto">
            <template v-if="isLoading">
                <div class="mx-auto flex w-full max-w-[120rem] flex-col gap-[1.6rem] px-[2.4rem] py-[3.6rem]">
                    <VSkeleton height="14rem" />
                    <VSkeleton height="22rem" />
                    <VSkeleton height="32rem" />
                </div>
            </template>

            <template v-else-if="loadError">
                <div class="mx-auto w-full max-w-[120rem] px-[2.4rem] py-[3.6rem]">
                    <VAlert
                        status="error"
                        :title="COPY.loadErrorTitle"
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

                <div class="mx-auto w-full max-w-[120rem] px-[2.4rem] pb-[8rem] pt-[2.4rem]">
                    <!-- Section: Stats -->
                    <ProfileSectionHeader
                        :eyebrow="COPY.statsEyebrow"
                        :title="COPY.statsTitle"
                        :hint="COPY.statsHint"
                    />

                    <div class="mb-[1.8rem] grid grid-cols-1 gap-[1.4rem] sm:grid-cols-2 lg:grid-cols-4">
                        <ProfileStatBig
                            :label="COPY.completedLabel"
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
                            :label="COPY.averageLabel"
                            :value="String(averageScore)"
                            :sub="COPY.scoreOutOf"
                        >
                            <template #footer>
                                <ProfileStatProgress
                                    :value="averageScore"
                                    :max="100"
                                />
                            </template>
                        </ProfileStatBig>

                        <ProfileStatBig
                            :label="COPY.streakLabel"
                            :value="String(streak)"
                            :sub="COPY.streakUnit"
                            :chip="`${streak}/${STREAK_GOAL}`"
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
                            :label="COPY.practiceLabel"
                            :value="String(practiceHours)"
                            :sub="COPY.practiceUnit"
                            :chip="COPY.practiceChip"
                        >
                            <template #footer>
                                <ProfileStatSparkline :data="practiceSparkline" />
                            </template>
                        </ProfileStatBig>
                    </div>

                    <div class="mb-[1.8rem]">
                        <ProfileActivityChart :data="activity30d" />
                    </div>

                    <div class="mb-[1.8rem] grid grid-cols-1 gap-[1.4rem] lg:grid-cols-2">
                        <ProfileAccuracyDonut :buckets="accuracyBuckets" />
                        <ProfileSpecialtyBars :items="specialtyRows" />
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
                        style="scroll-margin-top: 2.4rem;"
                    >
                        <ProfileSectionHeader
                            :eyebrow="COPY.settingsEyebrow"
                            :title="COPY.settingsTitle"
                            :hint="COPY.settingsHint"
                        >
                            <template #action>
                                <div
                                    v-if="!editing"
                                    class="flex items-center gap-[1rem]"
                                >
                                    <transition name="fade">
                                        <span
                                            v-if="justSaved"
                                            class="inline-flex items-center gap-[0.6rem] font-mono text-[1.2rem] text-brand"
                                        >
                                            <svg
                                                width="12"
                                                height="12"
                                                viewBox="0 0 12 12"
                                                fill="none"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    d="M2.5 6.2L4.8 8.5L9.5 3.5"
                                                    stroke="currentColor"
                                                    stroke-width="1.4"
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                />
                                            </svg>
                                            {{ COPY.savedToast }}
                                        </span>
                                    </transition>
                                    <VButton
                                        variant="secondary"
                                        size="sm"
                                        shape="rect"
                                        @click="handleStartEdit(false)"
                                    >
                                        {{ COPY.editButton }}
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
                                        @click="handleCancelEdit"
                                    >
                                        {{ COPY.cancelButton }}
                                    </VButton>
                                    <VButton
                                        size="sm"
                                        shape="rect"
                                        :loading="isSaving"
                                        @click="handleSaveEdit"
                                    >
                                        {{ COPY.applyButton }}
                                    </VButton>
                                </div>
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
