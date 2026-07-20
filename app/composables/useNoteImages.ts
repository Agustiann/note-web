interface NoteImage {
  id: string
  file_name: string
  url: string
  file_size: number | null
  mime_type: string
  created_at: string
}

interface ListResponse<T> {
  message: string
  data: T
}

interface SingleResponse<T> {
  message: string
  data: T
}

// Batasan ini mengikuti StoreNoteImageRequest & MAX_IMAGES_PER_NOTE di backend
// (App\Http\Controllers\Api\NoteImageController). Dipakai di frontend hanya
// untuk validasi awal / UX cepat — backend tetap jadi sumber kebenaran dan
// tetap memvalidasi ulang setiap request.
export const MAX_IMAGES = 3
export const MAX_IMAGE_SIZE = 2 * 1024 * 1024
export const MAX_IMAGE_SIZE_LABEL = '2MB'

export const useNoteImages = () => {
  const api = useApi()

  const fetchImages = async (noteId: string) => {
    const response = await api<ListResponse<NoteImage[]>>(`/notes/${noteId}/images`)
    return response.data
  }

  const uploadImage = async (noteId: string, file: File) => {
    const formData = new FormData()
    formData.append('image', file)

    const response = await api<SingleResponse<NoteImage>>(`/notes/${noteId}/images`, {
      method: 'POST',
      body: formData,
    })
    return response.data
  }

  const deleteImage = async (noteId: string, imageId: string) => {
    await api(`/notes/${noteId}/images/${imageId}`, { method: 'DELETE' })
  }

  const fetchImageBlobUrl = async (url: string) => {
    const blob = await api<Blob>(url, { responseType: 'blob' })
    return URL.createObjectURL(blob)
  }

  return {
    fetchImages,
    uploadImage,
    deleteImage,
    fetchImageBlobUrl,
  }
}