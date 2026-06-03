/**
 * @file Цветовая палитра вариантов аватара.
 */

import type { AvatarVariant } from '@/types'

/**
 * Пары [from, to] CSS-цветов для линейного градиента аватара.
 */
export const AVATAR_VARIANT_GRADIENTS: Record<AvatarVariant, readonly [string, string]> = {
    teal: ['#3fb9b3', '#0d7377'],
    sand: ['#e8c98a', '#b58a4e'],
    rose: ['#e8b0a6', '#c77566'],
    violet: ['#c5b8de', '#7a6da0'],
    mint: ['#b8d8d5', '#4a8a85'],
    sky: ['#a8c8d5', '#5a8ba3'],
} as const

/**
 * Вариант по умолчанию, когда пользователь ещё не выбрал свой.
 */
export const DEFAULT_AVATAR_VARIANT: AvatarVariant = 'teal'

/**
 * Возвращает CSS-строку linear-gradient для указанного варианта.
 *
 * @param variant — выбранный пользователем вариант палитры
 */
export function avatarGradient(variant: AvatarVariant): string {
    const [from, to] = AVATAR_VARIANT_GRADIENTS[variant]
    return `linear-gradient(135deg, ${from} 0%, ${to} 100%)`
}