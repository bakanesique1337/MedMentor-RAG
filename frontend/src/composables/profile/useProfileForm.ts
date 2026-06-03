import {computed, nextTick, ref, watch, type Ref} from 'vue'

import {useProfileApi} from '@/composables/api/useProfileApi'
import {PROFILE_ALERTS_TEXTS, PROFILE_HERO_FALLBACK_TEXTS} from '@/constants/profileViewTexts'
import {useAuthGateStore} from '@/stores/authGate'
import {useUserProfileStore} from '@/stores/userProfile'
import type {AvatarVariant, ProfileRole, UpdateUserSettingsRequest, UserSettings} from '@/types'

const SUCCESS_TOAST_DURATION_MS = 2400

export interface ProfileFormState {
    firstName: string
    lastName: string
    email: string
    role: string
    course: string
    faculty: string
    university: string
    avatarVariant: AvatarVariant
}

interface Params {
    userSettings: Ref<UserSettings | null>
}

/**
 * Owns the editable form state of the settings card and the edit/save/cancel lifecycle.
 * Also exposes hero-derived strings (fullName/role/faculty/university) that depend on
 * both the form draft and the persisted userSettings.
 */
export function useProfileForm({userSettings}: Params) {
    const profileApi = useProfileApi()
    const authGate = useAuthGateStore()
    const userProfile = useUserProfileStore()

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

    const editing = ref(false)
    const isSaving = ref(false)
    const saveError = ref<string | null>(null)
    const justSaved = ref(false)
    const settingsAnchor = ref<HTMLElement | null>(null)

    let savedSnapshot: ProfileFormState | null = null
    let toastTimer: ReturnType<typeof setTimeout> | null = null

    function splitDisplayName(name: string): {firstName: string; lastName: string} {
        const parts = name.trim().split(/\s+/).filter((p) => p.length > 0)
        const first = parts[0] ?? ''
        const last = parts.length > 1 ? parts.slice(1).join(' ') : ''
        return {firstName: first, lastName: last}
    }

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

    watch(userSettings, (next) => {
        if (next !== null) seedFormFromSettings(next)
    }, {immediate: true})

    function nullify(value: string): string | null {
        const trimmed = value.trim()
        return trimmed === '' ? null : trimmed
    }

    function scrollToSettings(): void {
        const element = settingsAnchor.value
        if (!element) return
        element.scrollIntoView({behavior: 'smooth', block: 'start'})
    }

    function showSuccessToast(): void {
        justSaved.value = true
        if (toastTimer !== null) clearTimeout(toastTimer)
        toastTimer = setTimeout(() => {
            justSaved.value = false
            toastTimer = null
        }, SUCCESS_TOAST_DURATION_MS)
    }

    function handleStartEdit(scrollIntoView = false): void {
        if (editing.value) {
            if (scrollIntoView) scrollToSettings()
            return
        }
        savedSnapshot = {...formState.value}
        editing.value = true
        saveError.value = null
        justSaved.value = false
        if (scrollIntoView) {
            nextTick(() => scrollToSettings())
        }
    }

    function handleCancelEdit(): void {
        if (savedSnapshot) {
            formState.value = {...savedSnapshot}
            savedSnapshot = null
        }
        editing.value = false
        saveError.value = null
    }

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
            userProfile.setSettings(updated)
            savedSnapshot = null
            editing.value = false
            showSuccessToast()
        } catch {
            saveError.value = PROFILE_ALERTS_TEXTS.saveError
        } finally {
            isSaving.value = false
        }
    }

    function handleFormUpdate(next: ProfileFormState): void {
        formState.value = next
    }

    const fullName = computed<string>(() => {
        const composed = `${formState.value.firstName} ${formState.value.lastName}`.trim()
        if (composed) return composed
        return userSettings.value?.displayName ?? authGate.displayName ?? PROFILE_HERO_FALLBACK_TEXTS.name
    })

    const heroRole = computed<string>(() => formState.value.role || PROFILE_HERO_FALLBACK_TEXTS.role)

    const heroFacultyLine = computed<string>(() => {
        const parts: string[] = []
        if (formState.value.course) parts.push(formState.value.course)
        if (formState.value.faculty) parts.push(formState.value.faculty)
        return parts.join(' · ') || PROFILE_HERO_FALLBACK_TEXTS.faculty
    })

    const heroUniversity = computed<string>(() => formState.value.university || PROFILE_HERO_FALLBACK_TEXTS.university)

    return {
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
    }
}