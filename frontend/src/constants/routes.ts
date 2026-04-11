export const ROUTES = {
    HOME: 'home',
    CASES: 'cases',
    PROFILE: 'profile',
    CHAT: 'chat',
    NOT_FOUND: 'not-found',
} as const

export type RouteName = (typeof ROUTES)[keyof typeof ROUTES]
