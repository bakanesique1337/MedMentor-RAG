/**
 * @file Хелпер для эндпоинтов списка клинических кейсов.
 */

import type {CaseCard} from '@/types'
import {apiGet} from './useApi'

/**
 * Composable для REST-эндпоинтов каталога задач (/api/cases).
 *
 * @returns объект с методом getCases
 */
export function useCasesApi() {
    /**
     * Возвращает полный список доступных карточек клинических задач.
     * Сервер сам фильтрует кейсы по правам пользователя (пока что список
     * одинаков для всех ролей, но интерфейс уже учитывает возможность изменения).
     *
     * @returns массив карточек кейсов с минимальной мета-информацией
     * @throws ApiError при transport- или HTTP-ошибке
     */
    async function getCases(): Promise<CaseCard[]> {
        return apiGet<CaseCard[]>('/api/cases')
    }

    return {getCases}
}
