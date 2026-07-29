import { useToast } from 'vue-toastification'

export const useAppToast = () => {
    const toast = useToast()

    return {
        created: (message = 'Data berhasil ditambahkan!') => toast.success(message),
        updated: (message = 'Data berhasil diubah!') => toast.info(message),
        deleted: (message = 'Data berhasil dihapus!') => toast.error(message),
        error: (message = 'Terjadi kesalahan, silakan coba lagi.') => toast.warning(message),
    }
}