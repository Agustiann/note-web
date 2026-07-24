import { useToast } from 'vue-toastification'

export const useAppToast = () => {
  const toast = useToast()

  return {
    success: (message = 'Data berhasil ditambahkan!') => toast.success(message),
    info: (message = 'Data berhasil diubah!') => toast.info(message),
    error: (message = 'Data berhasil dihapus!') => toast.error(message),
  }
}