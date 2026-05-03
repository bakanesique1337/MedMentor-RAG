import {
    OPENING_STATUS,
    SIMULATION_STATE,
    STREAM_CHUNK_TYPE,
    STREAMING_STATUS_TYPE,
} from '@/types'
import type {
    ActiveSimulation,
    ApiError,
    OpeningStatus,
    SimulationState,
    StreamChunk,
    StreamChunkType,
    StreamingStatusType,
} from '@/types'

/**
 * Set'ы для runtime-проверок строятся из единых const-объектов из @/types,
 * чтобы не дублировать список значений.
 */
const SIMULATION_STATES = new Set<string>(Object.values(SIMULATION_STATE))
const OPENING_STATUSES = new Set<string>(Object.values(OPENING_STATUS))
const STREAMING_STATUS_TYPES = new Set<string>(Object.values(STREAMING_STATUS_TYPE))
const STREAM_CHUNK_TYPES = new Set<string>(Object.values(STREAM_CHUNK_TYPE))

/**
 * Проверяет, что значение является строкой, undefined или null.
 *
 * @param value — проверяемое значение неизвестного типа.
 * @returns true, если значение пригодно как опциональная строка.
 */
function isOptionalString(value: unknown): boolean {
    return value === undefined || value === null || typeof value === 'string'
}

/**
 * Проверяет, что значение является объектом, в котором все значения — строки.
 *
 * @param value — проверяемое значение неизвестного типа.
 * @returns true, если значение совместимо с Record<string, string>.
 */
function isStringRecord(value: unknown): value is Record<string, string> {
    if (typeof value !== 'object' || value === null) {
        return false
    }

    return Object.values(value).every((entry) => typeof entry === 'string')
}

/**
 * Проверяет, что значение является валидным состоянием симуляции,
 * приходящим с бэкенда.
 *
 * @param value — проверяемое значение неизвестного типа.
 * @returns true, если значение принадлежит union-типу SimulationState.
 */
export function isSimulationState(value: unknown): value is SimulationState {
    return typeof value === 'string' && SIMULATION_STATES.has(value)
}

/**
 * Проверяет, что значение является валидным статусом подготовки
 * вступительной реплики пациента.
 *
 * @param value — проверяемое значение неизвестного типа.
 * @returns true, если значение принадлежит union-типу OpeningStatus.
 */
export function isOpeningStatus(value: unknown): value is OpeningStatus {
    return typeof value === 'string' && OPENING_STATUSES.has(value)
}

/**
 * Проверяет, что значение является валидным фронтовым типом стрима.
 *
 * @param value — проверяемое значение неизвестного типа.
 * @returns true, если значение принадлежит union-типу StreamingStatusType.
 */
export function isStreamingStatusType(value: unknown): value is StreamingStatusType {
    return typeof value === 'string' && STREAMING_STATUS_TYPES.has(value)
}

/**
 * Проверяет, что значение является валидным именем события чанка стрима.
 *
 * @param value — проверяемое значение неизвестного типа.
 * @returns true, если значение принадлежит union-типу StreamChunkType.
 */
export function isStreamChunkType(value: unknown): value is StreamChunkType {
    return typeof value === 'string' && STREAM_CHUNK_TYPES.has(value)
}

/**
 * Проверяет, что значение соответствует общей форме ошибки API.
 *
 * @param value — проверяемое значение неизвестного типа.
 * @returns true, если значение совместимо с интерфейсом ApiError.
 */
export function isApiError(value: unknown): value is ApiError {
    if (typeof value !== 'object' || value === null) {
        return false
    }

    const candidate = value as Record<string, unknown>
    const fieldErrors = candidate.fieldErrors
    const hasValidFieldErrors = fieldErrors === undefined || isStringRecord(fieldErrors)

    return typeof candidate.error === 'string'
        && typeof candidate.status === 'number'
        && hasValidFieldErrors
}

/**
 * Проверяет, что значение соответствует payload'у активной симуляции.
 *
 * @param value — проверяемое значение неизвестного типа.
 * @returns true, если значение совместимо с интерфейсом ActiveSimulation.
 */
export function isActiveSimulation(value: unknown): value is ActiveSimulation {
    if (typeof value !== 'object' || value === null) {
        return false
    }

    const candidate = value as Record<string, unknown>

    return typeof candidate.id === 'number'
        && typeof candidate.caseId === 'string'
        && typeof candidate.caseTitle === 'string'
        && typeof candidate.patientName === 'string'
        && isSimulationState(candidate.state)
        && isOpeningStatus(candidate.openingStatus)
        && typeof candidate.updatedAt === 'string'
}

/**
 * Проверяет, что значение соответствует чанку стрима симуляции.
 *
 * @param value — проверяемое значение неизвестного типа.
 * @returns true, если значение совместимо с интерфейсом StreamChunk.
 */
export function isStreamChunk(value: unknown): value is StreamChunk {
    if (typeof value !== 'object' || value === null) {
        return false
    }

    const candidate = value as Record<string, unknown>

    return typeof candidate.conversationId === 'string'
        && typeof candidate.timestamp === 'number'
        && isStreamChunkType(candidate.type)
        && isOptionalString(candidate.content)
        && isOptionalString(candidate.error)
}
