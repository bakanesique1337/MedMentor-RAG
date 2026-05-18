/**
 * @file Хелпер для эндпоинтов жизненного цикла симуляции.
 *
 * Покрывает весь путь сессии: старт по выбранному кейсу, диалог с виртуальным
 * пациентом, постановку финального диагноза, раскрытие осмотра/паспорта
 * и принудительное прерывание.
 *
 * Все методы валидируют sessionId через общий toSessionId, чтобы поломанный
 * id из маршрута падал предсказуемо до отправки запроса, а не в середине цепочки.
 */

import type {
    ActiveSimulation,
    SimulationCommandResponse,
    SimulationSession,
} from '@/types'
import {isActiveSimulation} from '@/utils/typeGuards'

import type {DiagnosePayload, GetSessionOptions} from './types'
import {apiGet, apiPost, toSessionId} from './useApi'

/**
 * Composable для REST-эндпоинтов жизненного цикла симуляции (/api/simulations/*).
 *
 * @returns объект с методами start, active, getSession, sendMessage,
 *          diagnose, revealExam, abandon
 */
export function useSimulationApi() {
    /**
     * Запускает новую сессию симуляции по выбранному кейсу.
     * Вступительная реплика пациента генерируется бэкендом стримом по WebSocket,
     * поэтому ответ возвращает только статус команды (OPENING_STARTED), а не
     * саму реплику; саму реплику UI забирает через useSimulationStream.
     *
     * @param caseId идентификатор клинического кейса
     * @returns статус команды (например, OPENING_STARTED)
     * @throws ApiError 409, если у пользователя уже есть незавершённая сессия
     * @throws ApiError 404, если caseId не найден
     */
    async function start(caseId: string): Promise<SimulationCommandResponse> {
        return apiPost<SimulationCommandResponse, { caseId: string }>(
            '/api/simulations/start',
            {caseId},
        )
    }

    /**
     * Возвращает текущую активную (незавершённую) сессию пользователя или null.
     *
     * Бэкенд при отсутствии активной сессии может вернуть пустое тело или поле
     * без сущности; здесь это нормализуется в null, чтобы наружу не утекала
     * Optional-семантика. Если данные пришли, но не прошли проверку
     * isActiveSimulation (например, бэкенд вернул объект с неожиданным набором
     * полей), также возвращается null - это безопаснее для UI, чем падение.
     *
     * @returns активная сессия или null, если её нет
     * @throws ApiError при ошибках транспорта или авторизации
     */
    async function active(): Promise<ActiveSimulation | null> {
        const raw = await apiGet<ActiveSimulation | null>('/api/simulations/active')

        if (raw === null || raw === undefined) {
            return null
        }

        return isActiveSimulation(raw) ? raw : null
    }

    /**
     * Возвращает полное состояние сессии по её id.
     * Параметр retryOpening=true говорит бэкенду перегенерировать вступительную
     * реплику пациента - используется, если первая попытка стрима упала
     * с OPENING_FAILED и пользователь нажал кнопку повторной попытки.
     *
     * @param sessionId идентификатор сессии (числом или строкой из роута)
     * @param options дополнительные опции, в т.ч. retryOpening
     * @returns полный объект сессии с сообщениями и метаданными
     * @throws TypeError если sessionId невалиден
     * @throws ApiError 404, если сессия не найдена
     */
    async function getSession(
        sessionId: number | string,
        options?: GetSessionOptions,
    ): Promise<SimulationSession> {
        const id = toSessionId(sessionId)
        const params = options?.retryOpening === true
            ? {retryOpening: true}
            : undefined

        return apiGet<SimulationSession>(`/api/simulations/${id}`, {params})
    }

    /**
     * Отправляет реплику доктора в активной сессии.
     * Ответ пациента приходит отдельным стримом по WebSocket, сам POST
     * только триггерит обработку и возвращает статус команды (REPLY_STARTED).
     *
     * @param sessionId идентификатор сессии
     * @param content текст реплики доктора (после trim/валидации на стороне UI)
     * @returns статус команды (например, REPLY_STARTED)
     * @throws TypeError если sessionId невалиден
     * @throws ApiError 409, если ответ ИИ уже генерируется (двойной submit)
     */
    async function sendMessage(
        sessionId: number | string,
        content: string,
    ): Promise<SimulationCommandResponse> {
        const id = toSessionId(sessionId)
        return apiPost<SimulationCommandResponse, { content: string }>(
            `/api/simulations/${id}/message`,
            {content},
        )
    }

    /**
     * Отправляет финальный диагноз доктора.
     * После успешной отправки сессия переходит в SCORING,
     * и бэкенд асинхронно считает итоговую оценку.
     *
     * @param sessionId идентификатор сессии
     * @param payload диагноз, обоснование (или null) и уверенность (или null)
     * @returns обновлённый объект сессии (уже в состоянии SCORING)
     * @throws TypeError если sessionId невалиден
     * @throws ApiError 409, если состояние сессии не разрешает постановку диагноза
     */
    async function diagnose(
        sessionId: number | string,
        payload: DiagnosePayload,
    ): Promise<SimulationSession> {
        const id = toSessionId(sessionId)
        return apiPost<SimulationSession, DiagnosePayload>(
            `/api/simulations/${id}/diagnose`,
            payload,
        )
    }

    /**
     * Раскрывает в сессии паспорт пациента и витальные показатели и вставляет
     * в ленту SYSTEM-карточку осмотра. Эндпоинт идемпотентен по самой карточке —
     * повторный вызов не продублирует её.
     *
     * Опциональный {@code content} — реплика врача, которая будет сохранена как
     * DOCTOR-сообщение перед карточкой (используется quick-prompt'ом «Провести
     * осмотр» в чате). Боковая кнопка в сайдбаре вызывает без content.
     *
     * Запрос НЕ запускает стрим ответа пациента — это «системное действие»,
     * а не вопрос пациенту.
     *
     * @param sessionId идентификатор сессии
     * @param content опциональная реплика врача
     * @returns обновлённый объект сессии с раскрытыми exam-полями
     * @throws TypeError если sessionId невалиден
     */
    async function revealExam(
        sessionId: number | string,
        content?: string,
    ): Promise<SimulationSession> {
        const id = toSessionId(sessionId)
        const body = content !== undefined && content !== ''
            ? {content}
            : undefined
        return apiPost<SimulationSession, { content: string }>(
            `/api/simulations/${id}/actions/exam`,
            body,
        )
    }

    /**
     * Прерывает незавершённую сессию: помечает её как ABANDONED, без диагноза
     * и без оценки. Допустимо в любом состоянии, кроме SCORING / COMPLETED /
     * ABANDONED (попытка прервать уже завершённую сессию вернёт 409).
     *
     * @param sessionId идентификатор сессии
     * @returns статус команды (ABANDONED)
     * @throws TypeError если sessionId невалиден
     * @throws ApiError 409, если состояние сессии не разрешает abandon
     */
    async function abandon(sessionId: number | string): Promise<SimulationCommandResponse> {
        const id = toSessionId(sessionId)
        return apiPost<SimulationCommandResponse>(`/api/simulations/${id}/abandon`)
    }

    return {abandon, active, diagnose, getSession, revealExam, sendMessage, start}
}
