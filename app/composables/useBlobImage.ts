export function useBlobImage() {
    const src = ref<string | null>(null)

    const revoke = () => {
        if (src.value) {
            URL.revokeObjectURL(src.value)
            src.value = null
        }
    }

    const setFromFile = (file: File | Blob) => {
        revoke()
        src.value = URL.createObjectURL(file)
    }

    const loadFrom = async (fetcher: () => Promise<Blob | string>) => {
        revoke()
        const result = await fetcher()
        src.value = typeof result === 'string' ? result : URL.createObjectURL(result)
    }

    onBeforeUnmount(revoke)

    return { src, setFromFile, loadFrom, revoke }
}

export interface BlobImageItem {
    id: string
    name: string
    src: string
    file?: File
    isDeleting?: boolean
}

export function useBlobImageList() {
    const items = ref<BlobImageItem[]>([])

    const add = (id: string, file: File) => {
        items.value.push({
            id,
            name: file.name,
            src: URL.createObjectURL(file),
            file,
        })
    }

    const addFromBlob = (id: string, name: string, blob: Blob) => {
        items.value.push({
            id,
            name,
            src: URL.createObjectURL(blob),
        })
    }

    const update = (id: string, patch: Partial<BlobImageItem>) => {
        const item = items.value.find(item => item.id === id)
        if (item) Object.assign(item, patch)
    }

    const remove = (id: string) => {
        const index = items.value.findIndex(item => item.id === id)
        if (index === -1) return

        const [removed] = items.value.splice(index, 1)
        if (removed) URL.revokeObjectURL(removed.src)
    }

    const clear = () => {
        items.value.forEach(item => URL.revokeObjectURL(item.src))
        items.value = []
    }

    onBeforeUnmount(clear)

    return { items, add, addFromBlob, update, remove, clear }
}