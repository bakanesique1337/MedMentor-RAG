import type {ApiError, SimulationSocket, SocketStatus, StreamChunk} from '@/types'
import {isStreamChunk} from '@/utils/typeGuards'
import {Client} from '@stomp/stompjs'
import {ref} from 'vue'
import SockJS from 'sockjs-client'
import {API_BASE_URL} from '@/constants/api'

type ChunkHandler = (chunk: StreamChunk) => void

/**
 * Управляет соединением STOMP/SockJS WebSocket для стриминга симуляции.
 *
 * @returns SimulationSocket
 */
export function useSimulationSocket(): SimulationSocket {
    const status = ref<SocketStatus>('idle')
    const lastChunk = ref<StreamChunk | null>(null)
    const error = ref<ApiError | null>(null)

    let client: Client | null = null
    let activeSessionId: number | null = null
    let chunkHandlers: ChunkHandler[] = []
    let pendingConnect = false
    let pendingSessionId: number | null = null

    /**
     * Строит фабрику SockJS-сокета на базе API_BASE_URL.
     *
     * @returns функция, создающая новый экземпляр SockJS, приведённый
     *          к типу WebSocket для совместимости с STOMP-клиентом.
     */
    function buildSockJsFactory(): () => WebSocket {
        const wsBase = API_BASE_URL.replace(/\/+$/, '')
        return () => new SockJS(`${wsBase}/ws`) as unknown as WebSocket
    }

    /**
     * Возвращает путь STOMP-топика, по которому сервер публикует чанки
     * стрима для конкретной сессии.
     *
     * @param sessionId — идентификатор сессии.
     * @returns строка вида '/topic/simulations/{sessionId}'.
     */
    function buildTopicPath(sessionId: number): string {
        return `/topic/simulations/${sessionId}`
    }

    /**
     * Сохраняет чанк в lastChunk и поочерёдно вызывает всех подписчиков.
     *
     * @param chunk — провалидированный StreamChunk, готовый к раздаче.
     */
    function dispatchChunk(chunk: StreamChunk): void {
        lastChunk.value = chunk

        for (const handler of chunkHandlers) {
            handler(chunk)
        }
    }

    /**
     * Парсит сырое тело STOMP-кадра, валидирует форму чанка и передаёт
     * его в dispatchChunk. Невалидные сообщения логируются и отбрасываются.
     *
     * @param body — сырая строка тела STOMP-кадра (ожидается JSON).
     */
    function handleIncomingMessage(body: string): void {
        console.debug('[useSimulationSocket] raw frame body:', body)

        let parsed: unknown

        try {
            parsed = JSON.parse(body)
        } catch {
            console.warn('[useSimulationSocket] Failed to parse message body:', body)
            return
        }

        if (!isStreamChunk(parsed)) {
            console.warn('[useSimulationSocket] Received unrecognized chunk shape:', parsed)
            return
        }

        console.debug('[useSimulationSocket] dispatching chunk:', parsed)
        dispatchChunk(parsed)
    }

    /**
     * Подписывается на STOMP-топик указанной сессии. Если ранее уже была
     * активная подписка — отписывается от неё перед сменой.
     *
     * @param sessionId — идентификатор сессии, на топик которой нужно подписаться.
     */
    function subscribeToSession(sessionId: number): void {
        if (!client?.connected) {
            console.debug('[useSimulationSocket] subscribe skipped, client not connected', {sessionId})
            return
        }

        const topic = buildTopicPath(sessionId)

        client.unsubscribe(`sub-${activeSessionId || ''}`)
        activeSessionId = sessionId

        console.debug('[useSimulationSocket] subscribing to topic', topic)
        client.subscribe(
            topic,
            (frame) => {
                handleIncomingMessage(frame.body)
            },
            {id: `sub-${sessionId}`},
        )
    }

    /**
     * Полностью гасит STOMP-клиент и сбрасывает связанное с ним состояние
     */
    function teardownClient(): void {
        if (!client) {
            return
        }

        try {
            client.deactivate()
        } catch {
            // Ошибки во время остановки игнорируются
        }

        client = null
        activeSessionId = null
        pendingConnect = false
        pendingSessionId = null
    }

    /**
     * Открывает транспорт Socket и подписывается на топик указанной сессии.
     *
     * @param sessionId — идентификатор симуляционной сессии, на которую
     *                    нужно подписаться.
     */
    function connect(sessionId: number): void {
        if (pendingConnect) {
            pendingSessionId = sessionId
            return
        }

        // Уже подключены к этой же сессии
        if (client?.connected && activeSessionId === sessionId) {
            return
        }

        // Уже подключены, но к другой сессии
        if (client?.connected && activeSessionId !== sessionId) {
            subscribeToSession(sessionId)
            return
        }

        teardownClient()
        pendingConnect = true
        pendingSessionId = sessionId
        status.value = 'connecting'
        error.value = null

        client = new Client({
            webSocketFactory: buildSockJsFactory(),
            reconnectDelay: 5000,

            onConnect: () => {
                pendingConnect = false
                status.value = 'open'
                const targetSession = pendingSessionId ?? sessionId
                console.debug('[useSimulationSocket] STOMP connected, subscribing', {targetSession})
                subscribeToSession(targetSession)
            },

            onDisconnect: () => {
                if (status.value === 'open' || status.value === 'connecting') {
                    status.value = 'reconnecting'
                }
            },

            onStompError: (frame) => {
                pendingConnect = false
                status.value = 'error'
                error.value = {
                    error: frame.headers['message'] ?? 'STOMP protocol error',
                    status: 0,
                }

                if (import.meta.env.DEV) {
                    console.error('[useSimulationSocket] STOMP error:', frame)
                }
            },

            onWebSocketError: (evt) => {
                pendingConnect = false
                status.value = 'error'
                error.value = {
                    error: 'WebSocket connection failed',
                    status: 0,
                }

                if (import.meta.env.DEV) {
                    console.error('[useSimulationSocket] WebSocket error:', evt)
                }
            },
        })

        client.activate()
    }

    /**
     * Закрывает транспорт сокета и очищает состояние подписки.
     */
    function disconnect(): void {
        teardownClient()
        status.value = 'closed'
    }

    /**
     * Принудительно выполняет полное переподключение. После успеха
     * переподписывается на последнюю известную сессию.
     */
    function reconnect(): void {
        const sessionId = activeSessionId

        teardownClient()

        if (sessionId !== null) {
            connect(sessionId)
        }
    }

    /**
     * Регистрирует обработчик, вызываемый для каждого провалидированного
     * входящего StreamChunk. Повторное добавление того же обработчика
     * молча игнорируется.
     *
     * @param handler — функция, принимающая очередной чанк стрима.
     * @returns функцию отписки, удаляющую обработчик из списка подписчиков.
     */
    function onChunk(handler: ChunkHandler): () => void {
        if (!chunkHandlers.includes(handler)) {
            chunkHandlers.push(handler)
        }

        return () => {
            chunkHandlers = chunkHandlers.filter((h) => h !== handler)
        }
    }

    return {
        connect,
        disconnect,
        error,
        lastChunk,
        onChunk,
        reconnect,
        status,
    }
}
