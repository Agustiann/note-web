import { useDateFormat } from '@vueuse/core'

export function useFormattedDate(
    date: MaybeRefOrGetter<string | number | Date | null | undefined>,
    formatStr: MaybeRefOrGetter<string>,
    fallback = ''
) {
    const hasValue = computed(() => !!toValue(date))

    const formatted = useDateFormat(
        () => {
            const value = toValue(date)
            return value ? new Date(value) : new Date()
        },
        formatStr,
        { locales: 'id-ID' }
    )

    return computed(() => (hasValue.value ? formatted.value : fallback))
}