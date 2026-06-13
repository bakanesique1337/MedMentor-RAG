import {readonly, ref} from 'vue'

import type {AppConfig} from '@/types'
import {useConfigApi} from '@/composables/api/useConfigApi'

const APP_NAME = 'MedMentor-RAG'

const config = ref<AppConfig | null>(null)
let inflight: Promise<void> | null = null

/**
 * Singleton-доступ к конфигурации приложения.
 *
 * @returns реактивный config, готовый versionTag и ensureLoaded()
 */
export function useAppConfig() {
    /**
     * Лениво загружает конфиг ровно один раз. Повторные вызовы и параллельные
     * вызовы переиспользуют тот же запрос/результат.
     */
    async function ensureLoaded(): Promise<void> {
        if (config.value !== null) return
        if (inflight === null) {
            inflight = useConfigApi()
                .getConfig()
                .then((loaded) => {
                    config.value = loaded
                })
                .catch(() => {
                    // Тег деградирует до APP_NAME без модели — не критично для UI.
                })
                .finally(() => {
                    inflight = null
                })
        }
        return inflight
    }

    return {
        config: readonly(config),
        appName: APP_NAME,
        ensureLoaded,
    }
}
