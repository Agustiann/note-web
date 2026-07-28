export function getInitials(name?: string | null): string {
    const value = name?.trim()
    if (!value) return ''

    const parts = value.split(/\s+/)
    const first = parts[0]
    const second = parts[1]

    if (!second) {
        return (first ?? '').charAt(0).toUpperCase()
    }

    return ((first ?? '').charAt(0) + second.charAt(0)).toUpperCase()
}