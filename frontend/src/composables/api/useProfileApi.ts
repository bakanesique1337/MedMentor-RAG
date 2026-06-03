/**
 * @file Хелпер для эндпоинтов профиля, настроек, истории сессий и статистики.
 */

import type {
    HistorySession,
    SimulationSession,
    SimulationStatsOverview,
    UpdateUserSettingsRequest,
    UserSettings,
} from '@/types'
import {mergeSettings} from '@/utils/mergeSettings'

import {apiGet, apiPut, toSessionId} from './useApi'

/**
 * Composable для REST-эндпоинтов профиля пользователя.
 *
 * @returns объект с методами settings, updateSettings, history, historyDetail, stats
 */
export function useProfileApi() {
    /**
     * Возвращает текущие настройки пользователя
     *
     * @returns полный объект настроек текущего пользователя
     * @throws ApiError при ошибках транспорта или авторизации
     */
    async function settings(): Promise<UserSettings> {
        return apiGet<UserSettings>('/api/settings')
    }

    /**
     * Сохраняет обновлённые настройки пользователя.
     * Перед отправкой делает GET /api/settings, чтобы вытянуть актуальные
     * настройки, и сливает их с переданными через mergeSettings.
     * Это нужно, чтобы фронтенд, не знающий обо всех ключах настроек
     * (например, добавленных другой версией клиента), случайно не затёр их
     * при PUT-замещении.
     *
     * @param payload новые значения полей профиля и misc-настроек
     * @returns полный объект настроек после сохранения (с серверной нормализацией)
     * @throws ApiError при ошибках валидации, транспорта или авторизации
     */
    async function updateSettings(payload: UpdateUserSettingsRequest): Promise<UserSettings> {
        const current = await settings()

        const merged: UpdateUserSettingsRequest = {
            ...payload,
            settings: mergeSettings(current.settings, payload.settings),
        }

        return apiPut<UserSettings, UpdateUserSettingsRequest>('/api/settings', merged)
    }

    /**
     * Возвращает список завершённых сессий симуляции пользователя.
     *
     * @returns массив карточек завершённых сессий
     * @throws ApiError при ошибках транспорта или авторизации
     */
    async function history(): Promise<HistorySession[]> {
        return apiGet<HistorySession[]>('/api/history')
    }

    /**
     * Возвращает полное состояние конкретной сессии из истории, включая
     * сообщения, выбранный диагноз и итоговую оценку.
     *
     * @param sessionId идентификатор сессии (числом или строкой из маршрута)
     * @returns полный объект сессии
     * @throws TypeError если sessionId нельзя привести к положительному числу
     * @throws ApiError 404, если сессия не существует или не принадлежит пользователю
     */
    async function historyDetail(sessionId: number | string): Promise<SimulationSession> {
        const id = toSessionId(sessionId)
        return apiGet<SimulationSession>(`/api/history/${id}`)
    }

    /**
     * Возвращает агрегированные показатели текущего пользователя
     *
     * @returns объект с агрегированной статистикой
     * @throws ApiError при ошибках транспорта или авторизации
     */
    async function stats(): Promise<SimulationStatsOverview> {
        return apiGet<SimulationStatsOverview>('/api/stats/overview')
    }

    return {history, historyDetail, settings, stats, updateSettings}
}
