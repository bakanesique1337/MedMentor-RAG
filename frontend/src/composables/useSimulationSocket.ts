import { Client } from '@stomp/stompjs'
import { ref } from 'vue'
import SockJS from 'sockjs-client'

import { API_BASE_URL } from '@/constants/api'
import type { ApiError, StreamChunk } from '@/types'
import { isStreamChunk } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SocketStatus = 'idle' | 'connecting' | 'open' | 'reconnecting' | 'closed' | 'error'

type ChunkHandler = (chunk: StreamChunk) => void

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

/**
 * Manages the STOMP/SockJS WebSocket connection for simulation streaming.
 * Hides all topic names, subscription frames, and protocol details from views.
 *
 * Usage:
 *   const socket = useSimulationSocket()
 *   socket.connect(sessionId)
 *   socket.onChunk((chunk) => { ... })
 *   onUnmounted(() => socket.disconnect())
 */
export function useSimulationSocket() {
    const status = ref<SocketStatus>('idle')
    const lastChunk = ref<StreamChunk | null>(null)
    const error = ref<ApiError | null>(null)

    let client: Client | null = null
    let activeSessionId: number | null = null
    let chunkHandlers: ChunkHandler[] = []
    let pendingConnect = false
    let pendingSessionId: number | null = null

    // -----------------------------------------------------------------------
    // Internal helpers
    // -----------------------------------------------------------------------

    function buildSockJsFactory(): () => WebSocket {
        const wsBase = API_BASE_URL.replace(/\/+$/, '')
        return () => new SockJS(`${wsBase}/ws`) as unknown as WebSocket
    }

    function buildTopicPath(sessionId: number): string {
        return `/topic/simulations/${sessionId}`
    }

    function dispatchChunk(chunk: StreamChunk): void {
        lastChunk.value = chunk

        for (const handler of chunkHandlers) {
            handler(chunk)
        }
    }

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

    function subscribeToSession(sessionId: number): void {
        if (!client?.connected) {
            console.debug('[useSimulationSocket] subscribe skipped -- client not connected', { sessionId })
            return
        }

        const topic = buildTopicPath(sessionId)

        // Unsubscribe from previous topic if switching sessions
        client.unsubscribe(`sub-${activeSessionId ?? ''}`)
        activeSessionId = sessionId

        console.debug('[useSimulationSocket] subscribing to topic', topic)
        client.subscribe(
            topic,
            (frame) => {
                handleIncomingMessage(frame.body)
            },
            { id: `sub-${sessionId}` },
        )
    }

    function teardownClient(): void {
        if (!client) {
            return
        }

        try {
            client.deactivate()
        } catch {
            // Ignore errors during teardown
        }

        client = null
        activeSessionId = null
        pendingConnect = false
        pendingSessionId = null
    }

    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------

    /**
     * Opens the socket transport and subscribes to the given session topic.
     * Safe to call multiple times -- reconnects and resubscribes if needed.
     */
    function connect(sessionId: number): void {
        if (pendingConnect) {
            pendingSessionId = sessionId  // store latest intent even when early-returning
            return
        }

        // Already connected to the same session -- nothing to do
        if (client?.connected && activeSessionId === sessionId) {
            return
        }

        // Already connected but different session -- resubscribe without reconnect
        if (client?.connected && activeSessionId !== sessionId) {
            subscribeToSession(sessionId)
            return
        }

        teardownClient()
        pendingConnect = true
        pendingSessionId = sessionId       // store for onConnect
        status.value = 'connecting'
        error.value = null

        client = new Client({
            webSocketFactory: buildSockJsFactory(),
            reconnectDelay: 5000,

            onConnect: () => {
                pendingConnect = false
                status.value = 'open'
                // Use the latest intended sessionId, not the closure-captured one
                const targetSession = pendingSessionId ?? sessionId
                console.debug('[useSimulationSocket] STOMP connected, subscribing', { targetSession })
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
     * Closes the socket transport and clears subscription state.
     * Call in onUnmounted or when leaving the chat route.
     */
    function disconnect(): void {
        teardownClient()
        status.value = 'closed'
    }

    /**
     * Forces a full reconnect. Re-subscribes to the last known session on success.
     * Bypasses disconnect() to avoid emitting a spurious 'closed' transient state.
     */
    function reconnect(): void {
        const sessionId = activeSessionId

        teardownClient()

        if (sessionId !== null) {
            connect(sessionId)
        }
    }

    /**
     * Registers a handler that is called for every validated incoming StreamChunk.
     * Duplicate handlers are silently ignored.
     * Returns an unsubscribe function.
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