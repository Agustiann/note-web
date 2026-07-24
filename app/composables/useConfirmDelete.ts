import Swal from 'sweetalert2'

export const useConfirmDelete = async (itemLabel?: string) => {
  const result = await Swal.fire({
    title: 'Apakah anda yakin?',
    text: `${itemLabel} akan dihapus dan tidak bisa dikembalikan lagi!`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Ya, hapus!',
    cancelButtonText: 'Batal',
  })

  return result.isConfirmed
}