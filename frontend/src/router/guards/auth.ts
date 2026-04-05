import type { NavigationGuard } from 'vue-router'

/**
 * Placeholder route guard for protected app routes.
 * Real authentication bootstrap is introduced in phase 4.
 */
export const authGuard: NavigationGuard = async () => true
