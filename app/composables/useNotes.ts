import type { ApiResponse, Note, NotesListResponse } from '~/types/api'

interface NotePayload {
  title: string
  content: string | null
  folder_id: string | null
}

interface ChecklistPayload {
  id?: string
  content: string
  is_completed?: boolean
}

interface SaveNotePayload extends Partial<NotePayload> {
  images?: File[]
  checklists?: ChecklistPayload[]
  existingImageIds?: string[]
}

const buildNoteFormData = (payload: SaveNotePayload): FormData => {
  const formData = new FormData()

  if (payload.title !== undefined) formData.append('title', payload.title)
  if (payload.content !== undefined) formData.append('content', payload.content ?? '')
  if (payload.folder_id !== undefined) formData.append('folder_id', payload.folder_id ?? '')

  for (const file of payload.images ?? []) {
    formData.append('images[]', file)
  }

  if (payload.existingImageIds) {
    formData.append('existing_image_ids_provided', '1')
    payload.existingImageIds.forEach((id) => {
      formData.append('existing_image_ids[]', id)
    })
  }

  if (payload.checklists) {
    formData.append('checklists_provided', '1')
    payload.checklists.forEach((item, index) => {
      if (item.id) formData.append(`checklists[${index}][id]`, item.id)
      formData.append(`checklists[${index}][content]`, item.content)
      formData.append(`checklists[${index}][is_completed]`, item.is_completed ? '1' : '0')
    })
  }

  return formData
}

export const useNotesSync = () => {
  const version = useState('notes-sync-version', () => 0)
  const lastEvent = useState('notes-sync-event', () => null)

  const notifyNotesChanged = (event = null) => {
    lastEvent.value = event
    version.value++
  }

  return { version, lastEvent, notifyNotesChanged }
}

export const useNotes = () => {
  const api = useApi()

  const fetchNotes = async (folderId?: string | null) => {
    const response = await api<NotesListResponse<Note[]>>('/notes', {
      params: folderId ? { folder_id: folderId } : undefined,
    })
    return response
  }

  const fetchNote = async (id: string) => {
    const response = await api<ApiResponse<Note>>(`/notes/${id}`)
    return response.data
  }

  const createNote = async (payload: SaveNotePayload) => {
    const formData = buildNoteFormData(payload)

    const response = await api<ApiResponse<Note>>('/notes', {
      method: 'POST',
      body: formData,
    })
    return response.data
  }

  const updateNote = async (id: string, payload: SaveNotePayload) => {
    const formData = buildNoteFormData(payload)
    formData.append('_method', 'PUT')

    const response = await api<ApiResponse<Note>>(`/notes/${id}`, {
      method: 'POST',
      body: formData,
    })
    return response.data
  }

  const moveNote = async (id: string, folderId: string | null) => {
    return await updateNote(id, { folder_id: folderId })
  }

  const deleteNote = async (id: string) => {
    await api(`/notes/${id}`, { method: 'DELETE' })
  }

  return {
    fetchNotes,
    fetchNote,
    createNote,
    updateNote,
    moveNote,
    deleteNote,
  }
}