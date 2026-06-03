/**
 * @file Имена маршрутов Vue Router.
 */

/**
 * Имена всех маршрутов приложения.
 */
export const ROUTES = {
    HOME: 'home',
    CASES: 'cases',
    PROFILE: 'profile',
    CHAT: 'chat',
    RESULT: 'result',
    NOT_FOUND: 'not-found',
} as const

/**
 * Union-тип допустимых имён маршрутов.
 */
export type RouteName = (typeof ROUTES)[keyof typeof ROUTES]
