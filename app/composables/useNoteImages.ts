import type { ApiResponse, NoteImage } from '~/types/api'

export const MAX_IMAGES = 3
export const MAX_IMAGE_SIZE = 2 * 1024 * 1024
export const MAX_IMAGE_SIZE_LABEL = '2MB'

export const useNoteImages = () => {
  const api = useApi()

  const fetchImages = async (noteId: string) => {
    const response = await api<ApiResponse<NoteImage[]>>(`/notes/${noteId}/images`)
    return response.data
  }

  const uploadImage = async (noteId: string, file: File) => {
    const formData = new FormData()
    formData.append('image', file)

    const response = await api<ApiResponse<NoteImage>>(`/notes/${noteId}/images`, {
      method: 'POST',
      body: formData,
    })
    return response.data
  }

  const deleteImage = async (noteId: string, imageId: string) => {
    await api(`/notes/${noteId}/images/${imageId}`, { method: 'DELETE' })
  }

  const fetchImageBlob = async (url: string) => {
    return await api<Blob>(url, { responseType: 'blob', cache: 'no-store' })
  }

  return {
    fetchImages,
    uploadImage,
    deleteImage,
    fetchImageBlob,
  }
}