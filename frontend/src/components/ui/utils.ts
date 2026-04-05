export function cn(...classes: Array<string | false | null | undefined>): string {
    return classes.filter(Boolean).join(' ')
}

export function getInitials(name: string): string {
    const parts = name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)

    if (parts.length === 0) {
        return '?'
    }

    return parts.map((part) => part[0]?.toUpperCase() ?? '').join('')
}
