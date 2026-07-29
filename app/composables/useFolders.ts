import type { ApiResponse, Folder } from '~/types/api'

export const useFoldersSync = () => {
  const version = useState('folders-sync-version', () => 0)

  const notifyFoldersChanged = () => {
    version.value++
  }

  return { version, notifyFoldersChanged }
}

export const useFolders = () => {
  const api = useApi()

  const fetchFolders = async () => {
    const response = await api<ApiResponse<Folder[]>>('/folders')
    return response.data
  }

  const createFolder = async (name: string) => {
    const response = await api<ApiResponse<Folder>>('/folders', {
      method: 'POST',
      body: { name },
    })
    return response.data
  }

  const updateFolder = async (id: string, name: string) => {
    const response = await api<ApiResponse<Folder>>(`/folders/${id}`, {
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