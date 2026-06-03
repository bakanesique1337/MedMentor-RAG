/**
 * @file Глобальный стор настроек профиля пользователя.
 *
 * Хранит ответ GET /api/settings, чтобы дочерние компоненты (сайдбар,
 * футер сайдбара, профильная страница) показывали одинаковые displayName,
 * role, course, faculty и avatarVariant без дублирующих сетевых запросов.
 *
 * Стор не привязан к статусу аутентификации — фактический fetch должен
 * инициироваться слоем макета (AppLayout) только когда пользователь
 * авторизован.
 */

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { useProfileApi } from '@/composables/api/useProfileApi'
import { DEFAULT_AVATAR_VARIANT } from '@/constants/avatar'
import type { ApiError, AvatarVariant, UserSettings } from '@/types'
import { isApiError } from '@/utils/typeGuards'

export type UserProfileStatus = 'idle' | 'pending' | 'ready' | 'error'

export const useUserProfileStore = defineStore('userProfile', () => {
    const settings = ref<UserSettings | null>(null)
    const status = ref<UserProfileStatus>('idle')
    const loadError = ref<ApiError | null>(null)

    /** Промис активной загрузки, чтобы параллельные вызовы не дублировали запрос. */
    let loadPromise: Promise<UserSettings | null> | null = null

    const isReady = computed<boolean>(() => status.value === 'ready')

    const avatarVariant = computed<AvatarVariant>(
        () => settings.value?.avatarVariant ?? DEFAULT_AVATAR_VARIANT,
    )

    const displayName = computed<string>(() => {
        const composed = `${settings.value?.firstName ?? ''} ${settings.value?.lastName ?? ''}`.trim()
        if (composed) return composed
        return settings.value?.displayName ?? ''
    })

    /**
     * Складывает курс и факультет в одну подпись для футера сайдбара.
     * Возвращает пустую строку, если ни одно поле не заполнено.
     */
    const subtitle = computed<string>(() => {
        const role = settings.value?.role ?? ''
        const course = settings.value?.course ?? ''
        const faculty = settings.value?.faculty ?? ''
        const tail = [course, faculty].filter((p) => p.length > 0).join(', ')

        if (role && tail) return `${role} · ${tail}`
        return role || tail
    })

    /**
     * Подгружает настройки пользователя один раз и кэширует результат.
     * Повторные вызовы возвращают уже загруженное состояние.
     *
     * @returns актуальные настройки или null, если запрос упал
     */
    function loadSettings(): Promise<UserSettings | null> {
        if (status.value === 'ready' && settings.value !== null) {
            return Promise.resolve(settings.value)
        }

        if (loadPromise !== null) {
            return loadPromise
        }

        status.value = 'pending'
        loadError.value = null

        loadPromise = useProfileApi()
            .settings()
            .then((result) => {
                settings.value = result
                status.value = 'ready'
                return result
            })
            .catch((err: unknown) => {
                status.value = 'error'
                loadError.value = isApiError(err) ? err : { error: 'Failed to load profile', status: -1 }
                return null
            })
            .finally(() => {
                loadPromise = null
            })

        return loadPromise
    }

    /**
     * Синхронизирует стор с уже полученными настройками.
     * Используется ProfileView после успешного PUT /api/settings и при
     * первичной загрузке, когда настройки уже запрошены извне.
     *
     * @param next свежий объект настроек
     */
    function setSettings(next: UserSettings): void {
        settings.value = next
        status.value = 'ready'
        loadError.value = null
    }

    /**
     * Сбрасывает стор (например, при logout), чтобы при следующем входе
     * пользователь получил собственные настройки.
     */
    function reset(): void {
        settings.value = null
        status.value = 'idle'
        loadError.value = null
        loadPromise = null
    }

    return {
        settings,
        status,
        loadError,
        isReady,
        avatarVariant,
        displayName,
        subtitle,
        loadSettings,
        setSettings,
        reset,
    }
})