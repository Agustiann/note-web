<template>
    <div class="update-note">

        <div class="update-note__header">
            <span class="update-note__last-updated">{{ saveStatusLabel }}</span>
            <div class="update-note__header-actions">
                <button class="update-note__delete" type="button" :disabled="isDeleting" @click="handleDelete">
                    {{ isDeleting ? 'Menghapus...' : 'Hapus' }}
                </button>
                <button class="update-note__save" type="button" :disabled="isSaving || !isDirty" @click="handleSave">
                    {{ isSaving ? 'Menyimpan...' : 'Simpan Perubahan' }}
                </button>
            </div>
        </div>

        <div v-if="isLoading" class="update-note__loading">
            Memuat catatan...
        </div>

        <p v-else-if="loadError" class="update-note__error">{{ loadError }}</p>

        <div v-else class="update-note__card">

            <div class="update-note__meta">
                <NoteFolderSelect v-model:folder-id="form.folderId" :folders="folders" @open="loadFolders" />
            </div>

            <input v-model="form.title" class="update-note__title-input" placeholder="Judul catatan...">

            <NoteImageSection :images="images" :max-images="MAX_IMAGES" :max-size-label="MAX_IMAGE_SIZE_LABEL"
                :error="imageError" extra-hint="Perubahan gambar disimpan saat kamu klik Simpan Perubahan."
                @select-files="handleImageSelected" @remove="removeImage" />

            <div class="update-note__section">
                <textarea id="note-content" v-model="form.content" class="update-note__textarea" rows="6"
                    placeholder="Tulis catatan di sini..." />
            </div>

            <NoteChecklistSection ref="checklistSectionRef" :items="form.checklist"
                hint="Checklist disimpan saat kamu klik Simpan Perubahan." :error="checklistError"
                @enter="handleChecklistEnter" @blur="handleChecklistBlur" @toggle="toggleChecklistItem"
                @remove="removeChecklistItem" />

            <div class="update-note__footer">
                <span v-if="saveError" class="update-note__error">
                    {{ saveError }}
                </span>
            </div>

        </div>

    </div>
</template>

<script setup>
definePageMeta({ layout: 'default' })
useHead({ title: 'Update · Notes' })

const router = useRouter()
const route = useRoute()

const noteId = computed(() => route.query.id)
const toast = useAppToast()

const { fetchFolders } = useFolders()
const { version: foldersSyncVersion, lastEvent: foldersLastEvent, notifyFoldersChanged } = useFoldersSync()
const { fetchNote, updateNote, deleteNote } = useNotes()
const { fetchImageBlob } = useNoteImages()
const { version: notesSyncVersion, lastEvent: notesLastEvent, notifyNotesChanged } = useNotesSync()


const checklistSectionRef = ref(null)

const form = reactive({
    title: '',
    folderId: null,
    content: '',
    checklist: [],
})
const { items: images, add: addImage, addFromBlob, remove: removeImageItem, clear: clearImages } = useBlobImageList()

const isSaving = ref(false)
const saveError = ref('')
const imageError = ref('')
const checklistError = ref('')
const lastUpdated = ref(new Date())

const lastSaved = ref({ title: '', content: '', folderId: null, checklist: [], imageIds: [] })

const {
    data: pageData,
    pending: isLoading,
    error: loadErrorRaw,
    refresh: refreshNote,
} = await useAsyncData(
    () => `note-${noteId.value}`,
    async () => {
        const note = await fetchNote(noteId.value)
        return { note }
    },
    { watch: [noteId] }
)

const folders = ref([])
const foldersLoaded = ref(false)

const loadFolders = async () => {
    if (foldersLoaded.value) return
    try {
        folders.value = await fetchFolders()
        foldersLoaded.value = true
    } catch (error) {
    }
}

const loadError = computed(() => {
    if (!loadErrorRaw.value) return ''
    return loadErrorRaw.value?.data?.message || 'Gagal memuat catatan.'
})

const loadNoteImages = async (noteImages) => {
    clearImages()

    await Promise.allSettled(
        (noteImages ?? []).map(async (image) => {
            try {
                const blob = await fetchImageBlob(image.url)
                addFromBlob(image.id, image.file_name ?? '', blob)
            } catch (error) {
            }
        })
    )
}

const hydrateFromNote = (note) => {
    form.title = note.title
    form.folderId = note.folder_id
    form.content = note.content ?? ''
    form.checklist = (note.checklists ?? []).map(item => ({
        id: item.id,
        content: item.content,
        isCompleted: item.is_completed,
        isSaving: false,
        isDeleting: false,
    }))
    loadNoteImages(note.images)
    lastUpdated.value = new Date(note.updated_at)

    lastSaved.value = {
        title: note.title,
        content: note.content ?? '',
        folderId: note.folder_id ?? null,
        checklist: form.checklist.map(item => ({ id: item.id, content: item.content, isCompleted: item.isCompleted })),
        imageIds: (note.images ?? []).map(image => image.id),
    }

    folders.value = note.folder ? [note.folder] : []
    foldersLoaded.value = false
}

watch(pageData, (value) => {
    const note = value?.note
    if (!note) return
    hydrateFromNote(note)
}, { immediate: true })

let skipNextFoldersSync = false
watch(foldersSyncVersion, () => {
    if (skipNextFoldersSync) {
        skipNextFoldersSync = false
        return
    }
    if (isDirty.value) return 

    const event = foldersLastEvent.value
    if (event?.type === 'note' && event.note?.id !== noteId.value) return

    refreshNote()
})

let skipNextNotesSync = false
watch(notesSyncVersion, () => {
    if (skipNextNotesSync) {
        skipNextNotesSync = false
        return
    }
    if (isDirty.value) return

    const event = notesLastEvent.value
    const affectsThisNote = !event
        || (event.type === 'delete' && event.noteId === noteId.value)
        || event.note?.id === noteId.value

    if (!affectsThisNote) return

    refreshNote()
})

const lastUpdatedLabel = useFormattedDate(
    lastUpdated,
    'D MMM YYYY, HH:mm'
)

const saveStatusLabel = computed(() => {
    if (isSaving.value) return 'Menyimpan...'
    if (saveError.value) return 'Gagal menyimpan'
    if (isDirty.value) return 'Ada perubahan belum disimpan'
    return `Tersimpan · ${lastUpdatedLabel.value}`
})

const currentChecklistSnapshot = computed(() =>
    form.checklist
        .filter(item => item.content.trim())
        .map(item => ({ id: isTempId(item.id) ? null : item.id, content: item.content.trim(), isCompleted: item.isCompleted }))
)

const currentImageIdsSnapshot = computed(() =>
    images.value.filter(image => !image.file).map(image => image.id)
)

const isDirty = computed(() => {
    if (isLoading.value) return false

    const title = form.title.trim()
    const content = form.content?.trim() || ''

    if (title !== lastSaved.value.title) return true
    if (content !== lastSaved.value.content) return true
    if ((form.folderId ?? null) !== lastSaved.value.folderId) return true

    if (images.value.some(image => !!image.file)) return true // ada gambar baru yang belum diupload
    if (JSON.stringify(currentImageIdsSnapshot.value.sort()) !== JSON.stringify([...lastSaved.value.imageIds].sort())) return true

    const checklistNow = currentChecklistSnapshot.value
    const checklistBefore = lastSaved.value.checklist
    if (checklistNow.length !== checklistBefore.length) return true
    if (JSON.stringify(checklistNow) !== JSON.stringify(checklistBefore)) return true

    return false
})

const executeSave = async () => {
    if (!form.title.trim()) {
        saveError.value = 'Judul catatan tidak boleh kosong'
        return false
    }

    if (!isDirty.value) return true

    saveError.value = ''
    isSaving.value = true

    try {
        const newFiles = images.value.filter(image => image.file).map(image => image.file)
        const existingImageIds = images.value.filter(image => !image.file).map(image => image.id)

        const checklists = form.checklist
            .filter(item => item.content.trim())
            .map(item => ({
                id: isTempId(item.id) ? undefined : item.id,
                content: item.content.trim(),
                is_completed: item.isCompleted,
            }))

        const updated = await updateNote(noteId.value, {
            title: form.title.trim(),
            content: form.content?.trim() || null,
            folder_id: form.folderId,
            images: newFiles,
            existingImageIds,
            checklists,
        })

        hydrateFromNote(updated)

        skipNextNotesSync = true
        skipNextFoldersSync = true

        if (updated.folder_id) {
            notifyFoldersChanged({ type: 'note', note: updated })
        } else {
            notifyNotesChanged({ type: 'update', note: updated })
        }

        toast.created('Perubahan berhasil disimpan')

        return true
    } catch (error) {
        saveError.value = error?.data?.errors?.title?.[0]
            || error?.data?.message
            || 'Gagal menyimpan perubahan, coba lagi'
        toast.error(saveError.value)
        return false
    } finally {
        isSaving.value = false
    }
}

let inFlightSave = null

const performSave = () => {
    if (inFlightSave) return inFlightSave
    inFlightSave = executeSave().finally(() => {
        inFlightSave = null
    })
    return inFlightSave
}

const handleSave = () => performSave()

let noteDeleted = false

useUnsavedChangesGuard(() => !noteDeleted && isDirty.value, performSave)

const handleChecklistEnter = (item) => {
    if (!item.content.trim()) return
    checklistSectionRef.value?.addItem()
}

const handleChecklistBlur = (item) => {
    if (!item.content.trim()) {
        removeChecklistItem(item.id)
    }
}

const toggleChecklistItem = (item) => {}

const removeChecklistItem = (id) => {
    form.checklist = form.checklist.filter(item => item.id !== id)
}

const handleImageSelected = (fileList) => {
    const files = Array.from(fileList)
    imageError.value = ''

    const remainingSlots = MAX_IMAGES - images.value.length

    if (files.length > remainingSlots) {
        imageError.value = remainingSlots > 0
            ? `Kamu memilih ${files.length} gambar, tapi slot tersisa hanya ${remainingSlots}`
            : `Maksimal ${MAX_IMAGES} gambar`
    }

    const filesToProcess = files.slice(0, remainingSlots).filter((file) => {
        if (!file.type.startsWith('image/')) {
            imageError.value = `${file.name} bukan file gambar`
            return false
        }
        if (file.size > MAX_IMAGE_SIZE) {
            imageError.value = `${file.name} melebihi batas ${MAX_IMAGE_SIZE_LABEL}`
            return false
        }
        return true
    })

    for (const file of filesToProcess) {
        addImage(useTempId(), file)
    }
}

const removeImage = (id) => {
    removeImageItem(id)
}

const isDeleting = ref(false)

const handleDelete = async () => {
    if (isDeleting.value) return

    const confirmed = await useConfirmDelete('Catatan ini', 'Tindakan ini tidak bisa dibatalkan.')
    if (!confirmed) return

    isDeleting.value = true

    try {
        await deleteNote(noteId.value)
        noteDeleted = true
        skipNextNotesSync = true
        notifyNotesChanged({ type: 'delete', noteId: noteId.value })
        toast.deleted('Catatan berhasil dihapus')
        await router.push('/notes')
    } catch (error) {
        saveError.value = error?.data?.message || 'Gagal menghapus catatan.'
        toast.error(saveError.value)
    } finally {
        isDeleting.value = false
    }
}
</script>