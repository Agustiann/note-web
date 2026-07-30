import Swal from 'sweetalert2'
import { useEventListener } from '@vueuse/core'

interface UnsavedChangesGuardOptions {
  confirmOnLeave?: boolean
}

export function useUnsavedChangesGuard(
  hasUnsavedChanges: () => boolean,
  onSave: () => Promise<boolean>,
  options: UnsavedChangesGuardOptions = {}
) {
  const { confirmOnLeave = true } = options

  useEventListener('beforeunload', (event: BeforeUnloadEvent) => {
    if (!hasUnsavedChanges()) return
    event.preventDefault()
  })

  onBeforeRouteLeave(async () => {
    if (!hasUnsavedChanges()) return true

    if (!confirmOnLeave) {
      return await onSave()
    }

    const result = await Swal.fire({
      title: 'Simpan catatan?',
      text: 'Kamu punya perubahan yang belum disimpan.',
      icon: 'question',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      denyButtonText: 'Buang',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#3085d6',
      denyButtonColor: '#d33',
    })

    if (result.isConfirmed) return await onSave()
    if (result.isDenied) return true
    return false
  })
}