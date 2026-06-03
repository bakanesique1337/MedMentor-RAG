/**
 * Merges the full settings payload while preserving unknown backend keys.
 */
export function mergeSettings(
    currentSettings: Record<string, unknown>,
    updates: Partial<Record<string, unknown>>,
): Record<string, unknown> {
    return {
        ...currentSettings,
        ...updates,
    }
}
