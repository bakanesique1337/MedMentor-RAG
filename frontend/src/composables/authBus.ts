/**
 * Single-subscriber event bus for auth session events.
 *
 * Breaks the circular import chain between useApi (which detects 401 responses)
 * and authGate (which owns session invalidation and navigation).
 */

type UnauthorizedHandler = (requestUrl: string) => void

let unauthorizedHandler: UnauthorizedHandler | null = null

/**
 * Registers the handler called when a non-auth API request returns 401.
 * Only one handler may be registered; subsequent calls overwrite the previous.
 */
export function onUnauthorized(handler: UnauthorizedHandler): void {
    unauthorizedHandler = handler
}

/**
 * Emits the unauthorized event with the URL that returned 401.
 * No-op if no handler has been registered.
 */
export function emitUnauthorized(requestUrl: string): void {
    unauthorizedHandler?.(requestUrl)
}
