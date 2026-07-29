import type { ApiResponse, NoteChecklistItem } from '~/types/api'

export const useNoteChecklists = () => {
  const api = useApi()

  const fetchChecklists = async (noteId: string) => {
    const response = await api<ApiResponse<NoteChecklistItem[]>>(`/notes/${noteId}/checklists`)
    return response.data
  }

  const createChecklistItem = async (noteId: string, content: string, isCompleted = false) => {
    const response = await api<ApiResponse<NoteChecklistItem>>(`/notes/${noteId}/checklists`, {
      method: 'POST',
      body: { content, is_completed: isCompleted },
    })
    return response.data
  }

  const updateChecklistItem = async (
    noteId: string,
    checklistId: string,
    payload: Partial<{ content: string; is_completed: boolean }>
  ) => {
    const response = await api<ApiResponse<NoteChecklistItem>>(`/notes/${noteId}/checklists/${checklistId}`, {
      method: 'PUT',
      body: payload,
    })
    return response.data
  }

  const deleteChecklistItem = async (noteId: string, checklistId: string) => {
    await api(`/notes/${noteId}/checklists/${checklistId}`, { method: 'DELETE' })
  }

  return {
    fetchChecklists,
    createChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
  }
}