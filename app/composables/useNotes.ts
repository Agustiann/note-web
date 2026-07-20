interface NoteImage {
  id: string
  url: string
}

interface NoteChecklistItem {
  id: string
  content: string
  is_completed: boolean
  position: number
}

interface Note {
  id: string
  title: string
  content: string | null
  folder_id: string | null
  images: NoteImage[]
  checklists: NoteChecklistItem[]
  created_at: string
  updated_at: string
}

interface NotePayload {
  title: string
  content: string | null
  folder_id: string | null
}

interface ListResponse<T> {
  message: string
  meta: { total_all_notes: number }
  data: T
}

interface SingleResponse<T> {
  message: string
  data: T
}

export const useNotesSync = () => {
  const version = useState('notes-sync-version', () => 0)

  const notifyNotesChanged = () => {
    version.value++
  }

  return { version, notifyNotesChanged }
}

export const useNotes = () => {
  const api = useApi()

  const fetchNotes = async (folderId?: string | null) => {
    const response = await api<ListResponse<Note[]>>('/notes', {
      params: folderId ? { folder_id: folderId } : undefined,
    })
    return response
  }

  const fetchNote = async (id: string) => {
    const response = await api<SingleResponse<Note>>(`/notes/${id}`)
    return response.data
  }

  const createNote = async (payload: Partial<NotePayload>) => {
    const response = await api<SingleResponse<Note>>('/notes', {
      method: 'POST',
      body: payload,
    })
    return response.data
  }

  const updateNote = async (id: string, payload: Partial<NotePayload>) => {
    const response = await api<SingleResponse<Note>>(`/notes/${id}`, {
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