interface Folder {
  id: string
  name: string
  notes_count: number | null
  created_at: string
  updated_at: string
}

interface SingleResponse<T> {
  message: string
  data: T
}

export const useFolders = () => {
  const api = useApi()

  const fetchFolders = async () => {
    const response = await api<SingleResponse<Folder[]>>('/folders')
    return response.data
  }

  const createFolder = async (name: string) => {
    const response = await api<SingleResponse<Folder>>('/folders', {
      method: 'POST',
      body: { name },
    })
    return response.data
  }

  const updateFolder = async (id: string, name: string) => {
    const response = await api<SingleResponse<Folder>>(`/folders/${id}`, {
      method: 'PUT',
      body: { name },
    })
    return response.data
  }

  const deleteFolder = async (id: string) => {
    await api(`/folders/${id}`, { method: 'DELETE' })
  }

  return {
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
  }
}