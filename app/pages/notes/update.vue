<template>
    <div class="update-note">

        <div class="update-note__header">
            <span class="update-note__last-updated">{{ saveStatusLabel }}</span>
            <div class="update-note__header-actions">
                <button class="update-note__delete" type="button" @click="handleDelete">
                    Hapus
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

            <input v-model="form.title" class="update-note__title-input" placeholder="Judul catatan..."
                @blur="handleTitleBlur">

            <NoteImageSection :images="images" :max-images="MAX_IMAGES" :max-size-label="MAX_IMAGE_SIZE_LABEL"
                :error="imageError" @select-files="handleImageSelected" @remove="removeImage" />

            <div class="update-note__section">
                <textarea id="note-content" v-model="form.content" class="update-note__textarea" rows="6"
                    placeholder="Tulis catatan di sini..." @blur="handleContentBlur" />
            </div>

            <NoteChecklistSection ref="checklistSectionRef" :items="form.checklist"
                hint="Checklist tersimpan otomatis saat kamu mengisi teksnya." :error="checklistError"
                @enter="handleChecklistEnter" @blur="syncChecklistContent" @toggle="toggleChecklistItem"
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
const { uploadImage, deleteImage, fetchImageBlob } = useNoteImages()
const { createChecklistItem, updateChecklistItem, deleteChecklistItem } = useNoteChecklists()
const { version: notesSyncVersion, lastEvent: notesLastEvent, notifyNotesChanged } = useNotesSync()


const checklistSectionRef = ref(null)

const form = reactive({
    title: '',
    folderId: null,
    content: '',
    checklist: [],
})
const { items: images, add: addImage, addFromBlob, update: updateImage, remove: removeImageItem, clear: clearImages } = useBlobImageList()

const isSaving = ref(false)
const saveError = ref('')
const imageError = ref('')
const checklistError = ref('')
const lastUpdated = ref(new Date())
const lastSavedTitle = ref('')
const lastSavedContent = ref('')
const lastSavedFolderId = ref(null)

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

let isHydratingForm = false

watch(pageData, (value) => {
    const note = value?.note
    if (!note) return

    isHydratingForm = true

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
    lastSavedTitle.value = note.title
    lastSavedContent.value = note.content ?? ''
    lastSavedFolderId.value = note.folder_id ?? null

    folders.value = note.folder ? [note.folder] : []
    foldersLoaded.value = false

    nextTick(() => {
        isHydratingForm = false
    })
}, { immediate: true })

let skipNextFoldersSync = false
watch(foldersSyncVersion, () => {
    if (skipNextFoldersSync) {
        skipNextFoldersSync = false
        return
    }

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

    const event = notesLastEvent.value
    const affectsThisNote = !event
        || (event.type === 'delete' && event.noteId === noteId.value)
        || event.note?.id === noteId.value

    if (!affectsThisNote) return

    refreshNote()
})

useHead({ title: computed(() => form.title ? `${form.title} · Notes` : 'Catatan') })

const lastUpdatedLabel = useFormattedDate(
    lastUpdated,
    'D MMM YYYY, HH:mm'
)

const saveStatusLabel = computed(() => {
    if (isSaving.value) return 'Menyimpan...'
    if (saveError.value) return 'Gagal menyimpan'
    return `Tersimpan · ${lastUpdatedLabel.value}`
})

const isDirty = computed(() => {
    if (isLoading.value) return false
    const title = form.title.trim()
    const content = form.content?.trim() || ''
    return title !== lastSavedTitle.value
        || content !== lastSavedContent.value
        || (form.folderId ?? null) !== lastSavedFolderId.value
})

let inFlightSave = null

const performSave = () => {
    if (inFlightSave) return inFlightSave
    inFlightSave = executeSave().finally(() => {
        inFlightSave = null
    })
    return inFlightSave
}

const executeSave = async () => {
    if (!form.title.trim()) {
        saveError.value = 'Judul catatan tidak boleh kosong'
        return false
    }

    if (!isDirty.value) return true

    saveError.value = ''
    isSaving.value = true

    try {
        const updated = await updateNote(noteId.value, {
            title: form.title.trim(),
            content: form.content?.trim() || null,
            folder_id: form.folderId,
        })
        lastUpdated.value = new Date(updated.updated_at)
        lastSavedTitle.value = updated.title
        lastSavedContent.value = updated.content ?? ''
        lastSavedFolderId.value = updated.folder_id ?? null
        skipNextNotesSync = true
        skipNextFoldersSync = true

        if (updated.folder_id) {
            notifyFoldersChanged({ type: 'note', note: updated })
        } else {
            notifyNotesChanged({ type: 'update', note: updated })
        }
        return true
    } catch (error) {
        saveError.value = error?.data?.errors?.title?.[0]
            || error?.data?.message
            || 'Gagal menyimpan perubahan, coba lagi'
        return false
    } finally {
        isSaving.value = false
    }
}

watch(() => form.folderId, () => {
    if (isLoading.value) return
    if (isHydratingForm) return
    performSave()
})

const handleTitleBlur = () => {
    if (!form.title.trim()) {
        form.title = lastSavedTitle.value
        saveError.value = ''
        return
    }
    performSave()
}

const handleContentBlur = () => {
    performSave()
}

useUnsavedChangesGuard(() => isDirty.value, performSave, { confirmOnLeave: false })

const handleChecklistEnter = (item) => {
    if (!item.content.trim()) return
    syncChecklistContent(item)
    checklistSectionRef.value?.addItem()
}

const syncChecklistContent = async (item) => {
    if (item.isSaving || item.isDeleting) return

    const content = item.content.trim()

    if (!content) {
        await removeChecklistItem(item.id)
        return
    }

    item.isSaving = true
    checklistError.value = ''

    try {
        if (isTempId(item.id)) {
            const created = await createChecklistItem(noteId.value, content, item.isCompleted)
            item.id = created.id
            item.content = created.content
            item.isCompleted = created.is_completed
        } else {
            await updateChecklistItem(noteId.value, item.id, { content })
        }
    } catch (error) {
        checklistError.value = error?.data?.errors?.content?.[0]
            || error?.data?.message
            || 'Gagal menyimpan checklist.'
    } finally {
        item.isSaving = false
    }
}

const toggleChecklistItem = async (item) => {
    if (isTempId(item.id)) return

    item.isSaving = true
    checklistError.value = ''

    try {
        await updateChecklistItem(noteId.value, item.id, { is_completed: item.isCompleted })
    } catch (error) {
        item.isCompleted = !item.isCompleted
        checklistError.value = error?.data?.message || 'Gagal memperbarui status checklist.'
    } finally {
        item.isSaving = false
    }
}

const removeChecklistItem = async (id) => {
    const item = form.checklist.find(i => i.id === id)
    if (!item || item.isDeleting) return

    if (isTempId(item.id)) {
        form.checklist = form.checklist.filter(i => i.id !== id)
        return
    }

    item.isDeleting = true
    checklistError.value = ''

    try {
        await deleteChecklistItem(noteId.value, id)
        form.checklist = form.checklist.filter(i => i.id !== id)
    } catch (error) {
        item.isDeleting = false
        checklistError.value = error?.data?.message || 'Gagal menghapus checklist.'
    }
}

const handleImageSelected = async (fileList) => {
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

    const results = await Promise.allSettled(
        filesToProcess.map((file) => uploadImage(noteId.value, file))
    )

    const failedNames = []

    results.forEach((result, i) => {
        const file = filesToProcess[i]
        if (result.status === 'fulfilled') {
            const uploaded = result.value
            addImage(uploaded.id, file)
        } else {
            failedNames.push(file.name)
        }
    })

    if (failedNames.length) {
        imageError.value = `Gagal mengunggah: ${failedNames.join(', ')}`
    }
}

const removeImage = async (id) => {
    const image = images.value.find(img => img.id === id)
    if (!image || image.isDeleting) return

    updateImage(id, { isDeleting: true })

    try {
        await deleteImage(noteId.value, id)
        removeImageItem(id)
    } catch (error) {
        updateImage(id, { isDeleting: false })
        imageError.value = error?.data?.message || 'Gagal menghapus gambar.'
    }
}

const handleDelete = async () => {
    const confirmed = await useConfirmDelete('Catatan ini', 'Tindakan ini tidak bisa dibatalkan.')
    if (!confirmed) return

    try {
        await deleteNote(noteId.value)
        notifyNotesChanged({ type: 'delete', noteId: noteId.value })
        toast.success('Catatan berhasil dihapus')
        router.push('/notes')
    } catch (error) {
        saveError.value = error?.data?.message || 'Gagal menghapus catatan.'
        toast.error(saveError.value)
    }
}
</script>