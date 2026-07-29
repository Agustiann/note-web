import type { ApiResponse, Note, NotesListResponse } from '~/types/api'

interface NotePayload {
  title: string
  content: string | null
  folder_id: string | null
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

  const createNote = async (payload: Partial<NotePayload>) => {
    const response = await api<ApiResponse<Note>>('/notes', {
      method: 'POST',
      body: payload,
    })
    return response.data
  }

  const updateNote = async (id: string, payload: Partial<NotePayload>) => {
    const response = await api<ApiResponse<Note>>(`/notes/${id}`, {
      method: 'PUT',
      body: payload,
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