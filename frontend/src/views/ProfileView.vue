<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue'

import HistoryItem from '@/components/profile/HistoryItem.vue'
import { VAlert, VButton, VEmptyState, VSkeleton } from '@/components/ui'
import { useProfileApi } from '@/composables/useProfileApi'
import { useAuthGateStore } from '@/stores/authGate'
import type {
    HistorySession,
    SimulationSession,
    SimulationStatsOverview,
    UserSettings,
} from '@/types'

type ProfileTab = 'settings' | 'stats'

const profileApi = useProfileApi()
const authGate = useAuthGateStore()

const userSettings = ref<UserSettings | null>(null)
const stats = ref<SimulationStatsOverview | null>(null)
const historyList = ref<HistorySession[]>([])

const isLoading = ref(true)
const loadError = ref<string | null>(null)

const activeTab = ref<ProfileTab>('settings')

const formDisplayName = ref('')
const isEditMode = ref(false)
const isSettingsPending = ref(false)
const settingsSaveError = ref<string | null>(null)
const settingsSaveSuccess = ref(false)

const isDisplayNameUnchanged = computed(
    () => formDisplayName.value.trim() === (userSettings.value?.displayName ?? ''),
)

const expandedHistoryId = ref<number | null>(null)
const historyDetailCache = shallowRef<Map<number, SimulationSession>>(new Map())
const loadingDetailId = ref<number | null>(null)

const displayName = computed(() => userSettings.value?.displayName ?? authGate.displayName)

const initials = computed(() => {
    const name = displayName.value || 'У'
    return name
        .split(' ')
        .slice(0, 2)
        .map((p) => p[0] ?? '')
        .join('')
        .toUpperCase() || 'У'
})

/**
 * Loads settings, stats, and history in parallel.
 */
async function fetchProfileData(): Promise<void> {
    isLoading.value = true
    loadError.value = null

    try {
        const [settingsResult, statsResult, historyResult] = await Promise.all([
            profileApi.settings(),
            profileApi.stats(),
            profileApi.history(),
        ])

        userSettings.value = settingsResult
        stats.value = statsResult
        historyList.value = historyResult
        formDisplayName.value = settingsResult.displayName
    } catch {
        loadError.value = 'Не удалось загрузить профиль. Попробуйте обновить страницу.'
    } finally {
        isLoading.value = false
    }
}

/**
 * Saves updated display name while preserving existing settings keys.
 */
async function handleSaveSettings(): Promise<void> {
    if (!userSettings.value || isSettingsPending.value) return

    isSettingsPending.value = true
    settingsSaveError.value = null
    settingsSaveSuccess.value = false

    try {
        const updated = await profileApi.updateSettings({
            displayName: formDisplayName.value.trim(),
            settings: userSettings.value.settings,
        })

        userSettings.value = updated
        formDisplayName.value = updated.displayName
        settingsSaveSuccess.value = true
        isEditMode.value = false
    } catch {
        settingsSaveError.value = 'Не удалось сохранить изменения. Попробуйте снова.'
    } finally {
        isSettingsPending.value = false
    }
}

function handleEdit(): void {
    isEditMode.value = true
    settingsSaveSuccess.value = false
}

function handleCancelEdit(): void {
    isEditMode.value = false
    formDisplayName.value = userSettings.value?.displayName ?? ''
    settingsSaveError.value = null
}

function formatStat(value: number | null): string {
    if (value === null) return '—'
    return `${Math.round(value * 100)}%`
}

/**
 * Toggles inline expansion for a history entry.
 */
async function handleToggleHistory(sessionId: number): Promise<void> {
    if (expandedHistoryId.value === sessionId) {
        expandedHistoryId.value = null
        return
    }

    expandedHistoryId.value = sessionId

    if (historyDetailCache.value.has(sessionId)) return

    loadingDetailId.value = sessionId

    try {
        const detail = await profileApi.historyDetail(sessionId)
        historyDetailCache.value = new Map([...historyDetailCache.value, [sessionId, detail]])
    } catch {
        // Non-blocking: HistoryItem shows a fallback message.
    } finally {
        loadingDetailId.value = null
    }
}

onMounted(async () => {
    await fetchProfileData()
})
</script>

<template>
    <div class="flex h-full flex-col overflow-hidden">
        <header class="flex shrink-0 items-center gap-[1.2rem] border-b border-[color:var(--color-line)] bg-surface-base px-[2.4rem] py-[1.6rem]">
            <nav
                class="flex items-center gap-[0.8rem] text-[1.2rem] text-text-secondary"
                aria-label="Breadcrumbs"
            >
                <span>MedMentor</span>
                <svg
                    width="8"
                    height="8"
                    viewBox="0 0 8 8"
                    class="opacity-50"
                ><path
                    d="M3 2l3 2-3 2"
                    stroke="currentColor"
                    stroke-width="1.2"
                    fill="none"
                /></svg>
                <span class="font-medium text-text-primary">Профиль</span>
            </nav>
        </header>

        <div class="flex-1 overflow-y-auto">
            <div class="mx-auto w-full max-w-[112rem] px-[2.4rem] py-[2.4rem]">
                <div class="mb-[2.4rem]">
                    <p class="mb-[0.8rem] text-eyebrow text-brand">Личный кабинет</p>
                    <h1 class="font-serif text-[3.6rem] font-medium leading-[1.1] tracking-[-0.02em] text-text-primary">
                        Мой профиль
                    </h1>
                </div>

                <div
                    v-if="isLoading"
                    class="flex flex-col gap-[1.6rem]"
                >
                    <VSkeleton height="14rem" />
                    <VSkeleton height="20rem" />
                    <VSkeleton height="16rem" />
                </div>

                <VAlert
                    v-else-if="loadError"
                    status="error"
                    title="Не удалось загрузить профиль"
                    :description="loadError"
                />

                <template v-else>
                    <div class="mb-[2.4rem] flex gap-[0.4rem] border-b border-[color:var(--color-line)]">
                        <button
                            type="button"
                            class="border-b-[0.2rem] px-[0.8rem] pb-[1.2rem] text-[1.35rem] font-medium transition"
                            :class="activeTab === 'settings'
                                ? 'border-brand text-text-primary'
                                : 'border-transparent text-text-secondary hover:text-text-primary'"
                            @click="activeTab = 'settings'"
                        >
                            Аккаунт
                        </button>
                        <button
                            type="button"
                            class="border-b-[0.2rem] px-[0.8rem] pb-[1.2rem] text-[1.35rem] font-medium transition"
                            :class="activeTab === 'stats'
                                ? 'border-brand text-text-primary'
                                : 'border-transparent text-text-secondary hover:text-text-primary'"
                            @click="activeTab = 'stats'"
                        >
                            Статистика и история
                        </button>
                    </div>

                    <!-- Settings tab -->
                    <div
                        v-if="activeTab === 'settings'"
                        class="rounded-[1.4rem] border border-[color:var(--color-line)] bg-white p-[3rem] shadow-card"
                    >
                        <div
                            v-if="isEditMode"
                            class="mb-[1.6rem] inline-flex items-center gap-[0.6rem] rounded-full bg-[color:var(--color-amber-soft)] px-[1rem] py-[0.4rem] text-eyebrow-sm text-[color:var(--color-amber-text)]"
                        >
                            <span class="h-[0.6rem] w-[0.6rem] rounded-full bg-[color:var(--color-amber)] anim-pulse" />
                            Режим редактирования
                        </div>

                        <div class="mb-[2.4rem] flex items-center gap-[1.8rem]">
                            <div
                                class="flex size-[8rem] shrink-0 items-center justify-center rounded-full text-[2.4rem] font-semibold text-[color:var(--color-ink)]"
                                style="background: linear-gradient(135deg, var(--color-dark-teal), var(--color-teal-deep));"
                            >
                                {{ initials }}
                            </div>
                            <div class="min-w-0">
                                <p class="font-serif text-[2.4rem] font-medium leading-[1.15] tracking-[-0.02em] text-text-primary">
                                    {{ displayName }}
                                </p>
                                <p class="mt-[0.3rem] text-[1.3rem] text-text-secondary">
                                    @{{ userSettings?.username ?? authGate.username }}
                                </p>
                                <p class="mt-[0.3rem] text-[1.2rem] text-text-tertiary">
                                    Студент &middot; 5&nbsp;курс, лечебный факультет
                                </p>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 gap-[1.6rem] sm:grid-cols-2">
                            <label class="flex flex-col gap-[0.6rem]">
                                <span class="text-eyebrow-sm text-text-secondary">Отображаемое имя</span>
                                <input
                                    v-model="formDisplayName"
                                    type="text"
                                    :disabled="!isEditMode"
                                    class="h-[4.4rem] rounded-[0.9rem] border bg-surface-base px-[1.4rem] text-[1.4rem] text-text-primary outline-none transition focus:border-brand focus:bg-white disabled:opacity-70"
                                    :class="isEditMode ? 'border-[color:var(--color-line-2)]' : 'border-[color:var(--color-line)]'"
                                />
                            </label>
                            <label class="flex flex-col gap-[0.6rem]">
                                <span class="text-eyebrow-sm text-text-secondary">Логин</span>
                                <input
                                    :value="userSettings?.username"
                                    type="text"
                                    disabled
                                    class="h-[4.4rem] rounded-[0.9rem] border border-[color:var(--color-line)] bg-surface-base px-[1.4rem] text-[1.4rem] text-text-tertiary"
                                />
                            </label>
                        </div>

                        <VAlert
                            v-if="settingsSaveSuccess"
                            status="success"
                            description="Изменения сохранены."
                            class="mt-[1.6rem]"
                        />
                        <VAlert
                            v-if="settingsSaveError"
                            status="error"
                            :description="settingsSaveError"
                            class="mt-[1.6rem]"
                        />

                        <div class="mt-[2rem] flex gap-[1rem]">
                            <template v-if="isEditMode">
                                <VButton
                                    :disabled="isSettingsPending || isDisplayNameUnchanged"
                                    :loading="isSettingsPending"
                                    @click="handleSaveSettings"
                                >
                                    Готово
                                </VButton>
                                <VButton
                                    variant="ghost"
                                    :disabled="isSettingsPending"
                                    @click="handleCancelEdit"
                                >
                                    Отмена
                                </VButton>
                            </template>
                            <VButton
                                v-else
                                @click="handleEdit"
                            >
                                Редактировать профиль
                            </VButton>
                        </div>
                    </div>

                    <!-- Stats tab -->
                    <div
                        v-else
                        class="grid gap-[2rem] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]"
                    >
                        <div class="rounded-[1.4rem] border border-[color:var(--color-line)] bg-white p-[2.4rem] shadow-card">
                            <p class="text-eyebrow text-brand">Прогресс</p>
                            <div class="mt-[1.2rem] text-center">
                                <p class="font-serif text-[6rem] font-medium leading-none text-text-primary">
                                    {{ stats?.completedSessions ?? 0 }}
                                </p>
                                <p class="mt-[0.4rem] text-[1.3rem] text-text-secondary">
                                    Завершённых симуляций
                                </p>
                            </div>

                            <div
                                v-if="stats"
                                class="mt-[2rem] grid grid-cols-2 gap-[0.8rem]"
                            >
                                <div class="flex flex-col items-center gap-[0.2rem] rounded-[0.8rem] border border-[color:var(--color-line)] bg-surface-base p-[1.2rem]">
                                    <p class="text-eyebrow-sm text-text-tertiary">Вежливость</p>
                                    <p class="font-serif text-[2rem] font-medium text-text-primary">
                                        {{ formatStat(stats.averagePoliteness) }}
                                    </p>
                                </div>
                                <div class="flex flex-col items-center gap-[0.2rem] rounded-[0.8rem] border border-[color:var(--color-line)] bg-surface-base p-[1.2rem]">
                                    <p class="text-eyebrow-sm text-text-tertiary">Структура</p>
                                    <p class="font-serif text-[2rem] font-medium text-text-primary">
                                        {{ formatStat(stats.averageQuestioningStructure) }}
                                    </p>
                                </div>
                                <div class="flex flex-col items-center gap-[0.2rem] rounded-[0.8rem] border border-[color:var(--color-line)] bg-surface-base p-[1.2rem]">
                                    <p class="text-eyebrow-sm text-text-tertiary">Полнота</p>
                                    <p class="font-serif text-[2rem] font-medium text-text-primary">
                                        {{ formatStat(stats.averageThoroughness) }}
                                    </p>
                                </div>
                                <div class="flex flex-col items-center gap-[0.2rem] rounded-[0.8rem] border border-[color:var(--color-line)] bg-surface-base p-[1.2rem]">
                                    <p class="text-eyebrow-sm text-text-tertiary">Эмпатия</p>
                                    <p class="font-serif text-[2rem] font-medium text-text-primary">
                                        {{ formatStat(stats.averageEmpathy) }}
                                    </p>
                                </div>
                                <div class="col-span-2 flex flex-col items-center gap-[0.2rem] rounded-[0.8rem] border border-[color:rgb(13_115_119_/_0.25)] bg-brand-ghost p-[1.2rem]">
                                    <p class="text-eyebrow-sm text-brand-deep">Точность диагноза</p>
                                    <p class="font-serif text-[2rem] font-medium text-brand">
                                        {{ formatStat(stats.averageDiagnosisCorrect) }}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div class="rounded-[1.4rem] border border-[color:var(--color-line)] bg-white p-[2.4rem] shadow-card">
                            <h2 class="font-serif text-[2rem] font-medium leading-[1.2] tracking-[-0.02em] text-text-primary">
                                История сессий
                            </h2>

                            <VEmptyState
                                v-if="historyList.length === 0"
                                class="mt-[1.6rem]"
                                title="Ещё нет сессий"
                                description="Ваши завершённые симуляции появятся здесь."
                            />

                            <div
                                v-else
                                class="mt-[0.8rem] flex flex-col"
                            >
                                <HistoryItem
                                    v-for="session in historyList"
                                    :key="session.id"
                                    :session="session"
                                    :is-expanded="expandedHistoryId === session.id"
                                    :detail="historyDetailCache.get(session.id) ?? null"
                                    :is-detail-loading="loadingDetailId === session.id"
                                    @toggle="handleToggleHistory"
                                />
                            </div>
                        </div>
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>
