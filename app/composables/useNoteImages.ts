export const MAX_IMAGES = 3
export const MAX_IMAGE_SIZE = 2 * 1024 * 1024
export const MAX_IMAGE_SIZE_LABEL = '2MB'

export const useNoteImages = () => {
  const api = useApi()

  const fetchImageBlob = async (url: string) => {
    return await api<Blob>(url, { responseType: 'blob', cache: 'no-store' })
  }

  return {
    fetchImageBlob,
  }
}