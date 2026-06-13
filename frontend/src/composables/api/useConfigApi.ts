import type {AppConfig} from '@/types'
import {apiGet} from './useApi'

/**
 * Composable для конфигурации приложения.
 *
 * @returns объект с методом getConfig
 */
export function useConfigApi() {

    async function getConfig(): Promise<AppConfig> {
        return apiGet<AppConfig>('/api/config')
    }

    return {getConfig}
}