import Swal from 'sweetalert2'

export function useUnsavedChangesGuard(
  hasUnsavedChanges: () => boolean,
  onSave: () => Promise<boolean>
) {
  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (!hasUnsavedChanges()) return

    event.preventDefault()
  }

  onMounted(() => {
    window.addEventListener('beforeunload', handleBeforeUnload)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  })

  onBeforeRouteLeave(async (_to, _from, next) => {
    if (!hasUnsavedChanges()) {
      next()
      return
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

    if (result.isConfirmed) {
      const saved = await onSave()
      next(saved)
      return
    }

    if (result.isDenied) {
      next()
      return
    }

    next(false)
  })
}