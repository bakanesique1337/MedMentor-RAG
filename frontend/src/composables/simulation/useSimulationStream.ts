import {
    OPENING_STATUS,
    STREAM_CHUNK_TYPE,
    STREAMING_STATUS_TYPE,
    type ActiveStreamKind,
    type SimulationSession,
    type SimulationStream,
    type StreamChunk,
} from '@/types'
import {SIMULATION_STREAM_MESSAGES} from '@/constants/simulationStreamTexts'
import type {UseSimulationStreamParams} from './types'
import {onMounted, onUnmounted, ref, watch} from 'vue'

/**
 * Карта соответствия типа активного стрима человекочитаемому сообщению об ошибке.
 * Если тип неизвестен (kind === null),
 * подбирается сообщение для обычного стрима ответа пациента как наиболее
 * вероятный сценарий.
 */
const STREAM_ERROR_MESSAGE_BY_KIND: Record<ActiveStreamKind, string> = {
    [STREAMING_STATUS_TYPE.OPENING]: SIMULATION_STREAM_MESSAGES.openingStreamFailed,
    [STREAMING_STATUS_TYPE.FINDING]: SIMULATION_STREAM_MESSAGES.findingStreamFailed,
    [STREAMING_STATUS_TYPE.MESSAGE]: SIMULATION_STREAM_MESSAGES.messageStreamFailed,
}

/**
 * Управляет UI-состоянием WebSocket-стрима модели:
 *  - буфер постепенно дописываемого ответа (streamingContent);
 *  - "оптимистично" показанная реплика врача до подтверждения с сервера (pendingSentMessage);
 *  - тип активного стрима (activeStreamKind: opening / message / finding);
 *  - человекочитаемая ошибка стрима (streamErrorMessage).
 *
 * Что делает:
 *  - подписывается на чанки в onMounted и отписывается в onUnmounted;
 *  - синхронизирует activeStreamKind с серверным состоянием через watch на session;
 *  - реагирует на падение Socket (status === 'error'): сбрасывает буфер и показывает
 *    сообщение.
 *
 * @param params — объект с реактивными sessionId/session, общим Socket и
 *                 callback'ами, которые композабл вызывает на чанках 'done' и 'error'.
 * @returns объект SimulationStream с реактивными состояниями и методами
 *                 для управления буферами из вызывающего кода.
 */
export function useSimulationStream(
    params: UseSimulationStreamParams,
): SimulationStream {
    const {sessionId, session, socket, onStreamDone, onStreamError} = params

    const streamingContent = ref('')
    const pendingSentMessage = ref<string | null>(null)
    const activeStreamKind = ref<ActiveStreamKind | null>(null)
    const streamErrorMessage = ref<string | null>(null)

    /**
     * По данным сессии определяет, какой стрим сейчас идёт.
     * Приоритет у явного streamingStatus.inFlight; если стрим не отмечен
     * как активный, но opening ещё не завершён — считает активным opening.
     *
     * @param data — текущее состояние симуляционной сессии с сервера.
     * @returns тип активного стрима либо null, если ни один стрим не активен.
     */
    function resolveStreamKind(data: SimulationSession): ActiveStreamKind | null {
        if (data.streamingStatus.inFlight) {
            const type = data.streamingStatus.type
            if (type === STREAMING_STATUS_TYPE.MESSAGE || type === STREAMING_STATUS_TYPE.FINDING) return type
            return STREAMING_STATUS_TYPE.OPENING
        }
        if (data.openingStatus === OPENING_STATUS.PENDING || data.openingStatus === OPENING_STATUS.STREAMING) {
            return STREAMING_STATUS_TYPE.OPENING
        }
        return null
    }

    /**
     * Подбирает текст ошибки в зависимости от того, какой стрим упал.
     *
     * @param kind — тип упавшего стрима либо null, если он не определён.
     * @returns готовый к показу пользователю текст ошибки.
     */
    function errorMessageForKind(kind: ActiveStreamKind | null): string {
        if (kind === null) return SIMULATION_STREAM_MESSAGES.messageStreamFailed
        return STREAM_ERROR_MESSAGE_BY_KIND[kind]
    }

    /**
     * Сбрасывает все буферы стрима в исходное состояние.
     */
    function resetBuffers(): void {
        activeStreamKind.value = null
        streamingContent.value = ''
        pendingSentMessage.value = null
    }

    /**
     * Помечает стрим заданного типа как активный и инициирует подключение
     * сокета на случай, если канал был закрыт между взаимодействиями.
     * Очищает предыдущий streamingContent.
     *
     * @param kind — тип стартующего стрима (opening / message / finding).
     */
    function beginStream(kind: ActiveStreamKind): void {
        activeStreamKind.value = kind
        streamingContent.value = ''
        socket.connect(sessionId.value)
    }

    /**
     * Обработчик одного чанка от сокета. Раздаёт по типам:
     *  - CHUNK — дописывает в буфер streamingContent;
     *  - DONE — вызывает onStreamDone и сбрасывает буферы;
     *  - WARNING — пишет в console.warn;
     *  - ERROR — сбрасывает буферы, выставляет streamErrorMessage и зовёт onStreamError.
     *
     * @param chunk — провалидированный StreamChunk, пришедший с сервера.
     */
    function handleChunk(chunk: StreamChunk): void {
        if (chunk.type === STREAM_CHUNK_TYPE.CHUNK && typeof chunk.content === 'string') {
            streamingContent.value += chunk.content
            return
        }
        if (chunk.type === STREAM_CHUNK_TYPE.DONE) {
            Promise.resolve(onStreamDone()).finally(() => {
                resetBuffers()
            })
            return
        }
        if (chunk.type === STREAM_CHUNK_TYPE.WARNING) {
            console.warn('[useSimulationStream] stream warning:', chunk.error)
            return
        }
        if (chunk.type === STREAM_CHUNK_TYPE.ERROR) {
            const failedKind = activeStreamKind.value
            resetBuffers()
            streamErrorMessage.value = errorMessageForKind(failedKind)
            onStreamError()
        }
    }

    // При (пере)загрузке сессии синхронизирует activeStreamKind с серверным состоянием
    // и сбрасывает накопленный текст ошибки стрима.
    watch(
        () => session.value,
        (data) => {
            if (data === null) return
            activeStreamKind.value = resolveStreamKind(data)
            streamErrorMessage.value = null
        },
    )

    // Защита от "зависшего стрима" при падении сокета
    watch(socket.status, (newStatus) => {
        if (newStatus === 'error' && activeStreamKind.value !== null) {
            resetBuffers()
            streamErrorMessage.value = SIMULATION_STREAM_MESSAGES.socketConnectionLost
        }
    })

    let unsubscribeChunk: (() => void) | null = null

    onMounted(() => {
        unsubscribeChunk = socket.onChunk(handleChunk)
    })

    onUnmounted(() => {
        if (unsubscribeChunk !== null) unsubscribeChunk()
    })

    return {
        streamingContent,
        pendingSentMessage,
        activeStreamKind,
        streamErrorMessage,
        beginStream,
        resetBuffers,
    }
}
