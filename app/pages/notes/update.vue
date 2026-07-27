<template>
    <NuxtLayout>
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

            <div v-else class="update-note__card">

                <div class="update-note__meta">
                    <NoteFolderSelect v-model:folder-id="form.folderId" :folders="folders" />
                </div>

                <input v-model="form.title" class="update-note__title-input" placeholder="Judul catatan..."
                    @blur="handleTitleBlur">

                <NoteImageSection :images="form.images" :max-images="MAX_IMAGES" :max-size-label="MAX_IMAGE_SIZE_LABEL"
                    :error="imageError" @select-files="handleImageSelected" @remove="removeImage" />

                <div class="update-note__section">
                    <textarea id="note-content" v-model="form.content" class="update-note__textarea" rows="6"
                        placeholder="Tulis catatan di sini..." />
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
    </NuxtLayout>
</template>

<script setup>
const router = useRouter()
const route = useRoute()
const noteId = computed(() => route.query.id)

const { fetchFolders } = useFolders()
const { version: foldersSyncVersion } = useFoldersSync()
const { fetchNote, updateNote, deleteNote } = useNotes()
const { uploadImage, deleteImage, fetchImageBlobUrl } = useNoteImages()
const { createChecklistItem, updateChecklistItem, deleteChecklistItem } = useNoteChecklists()
const { notifyNotesChanged } = useNotesSync()

const folders = ref([])
const checklistSectionRef = ref(null)

const form = reactive({
    title: '',
    folderId: null,
    content: '',
    checklist: [],
    images: [],
})

const isLoading = ref(true)
const isSaving = ref(false)
const saveError = ref('')
const imageError = ref('')
const checklistError = ref('')
const lastUpdated = ref(new Date())
const lastSavedTitle = ref('')

const lastUpdatedLabel = computed(() => {
    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(lastUpdated.value)
})

const saveStatusLabel = computed(() => {
    if (isSaving.value) return 'Menyimpan...'
    if (saveError.value) return 'Gagal menyimpan'
    return `Tersimpan · ${lastUpdatedLabel.value}`
})

const isTempId = (id) => typeof id === 'string' && id.startsWith('tmp-')

const loadImagePreviews = (images) => {
    for (const image of images) {
        const target = form.images.find((img) => img.id === image.id) ?? image

        fetchImageBlobUrl(target.url)
            .then((blobUrl) => { target.src = blobUrl })
            .catch(() => { })
    }
}

const revokeImagePreviews = () => {
    for (const image of form.images) {
        if (image.src) URL.revokeObjectURL(image.src)
    }
}

onBeforeUnmount(() => {
    revokeImagePreviews()
    clearTimeout(saveTimer)
})

const loadNote = async (id) => {
    if (!id) {
        saveError.value = 'Catatan tidak ditemukan.'
        isLoading.value = false
        return
    }

    isLoading.value = true
    saveError.value = ''

    try {
        const [note, folderList] = await Promise.all([
            fetchNote(id),
            fetchFolders(),
        ])

        folders.value = folderList

        form.title = note.title
        form.folderId = note.folder_id
        form.content = note.content ?? ''
        revokeImagePreviews()
        form.checklist = (note.checklists ?? []).map(item => ({
            id: item.id,
            content: item.content,
            isCompleted: item.is_completed,
            isSaving: false,
            isDeleting: false,
        }))
        form.images = (note.images ?? []).map(image => ({
            id: image.id,
            name: image.file_name ?? '',
            url: image.url,
            src: null,
            isDeleting: false,
        }))
        loadImagePreviews(form.images)
        lastUpdated.value = new Date(note.updated_at)
        lastSavedTitle.value = note.title
    } catch (error) {
        saveError.value = error?.data?.message || 'Gagal memuat catatan.'
    } finally {
        nextTick(() => { isLoading.value = false })
    }
}

watch(noteId, (id) => {
    loadNote(id)
}, { immediate: true })

watch(foldersSyncVersion, async () => {
    try {
        folders.value = await fetchFolders()
    } catch (error) {
    }
})

let saveTimer = null

const performSave = async () => {
    if (!form.title.trim()) {
        saveError.value = 'Judul catatan tidak boleh kosong'
        return
    }

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
        notifyNotesChanged()
    } catch (error) {
        saveError.value = error?.data?.errors?.title?.[0]
            || error?.data?.message
            || 'Gagal menyimpan perubahan, coba lagi'
    } finally {
        isSaving.value = false
    }
}

const scheduleSave = () => {
    if (isLoading.value) return
    clearTimeout(saveTimer)
    saveTimer = setTimeout(performSave, 800)
}

watch(() => form.title, scheduleSave)
watch(() => form.content, scheduleSave)

watch(() => form.folderId, () => {
    if (isLoading.value) return
    clearTimeout(saveTimer)
    performSave()
})

const handleTitleBlur = () => {
    if (form.title.trim()) return
    clearTimeout(saveTimer)
    form.title = lastSavedTitle.value
    saveError.value = ''
}

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

    const remainingSlots = MAX_IMAGES - form.images.length

    if (files.length > remainingSlots) {
        imageError.value = remainingSlots > 0
            ? `Kamu memilih ${files.length} gambar, tapi slot tersisa hanya ${remainingSlots}`
            : `Maksimal ${MAX_IMAGES} gambar`
    }

    const filesToProcess = files.slice(0, remainingSlots)

    for (const file of filesToProcess) {
        if (!file.type.startsWith('image/')) {
            imageError.value = `${file.name} bukan file gambar`
            continue
        }

        if (file.size > MAX_IMAGE_SIZE) {
            imageError.value = `${file.name} melebihi batas ${MAX_IMAGE_SIZE_LABEL}`
            continue
        }

        try {
            const uploaded = await uploadImage(noteId.value, file)
            const entry = {
                id: uploaded.id,
                name: uploaded.file_name,
                url: uploaded.url,
                src: null,
                isDeleting: false,
            }
            form.images.push(entry)
            loadImagePreviews([entry])
        } catch (error) {
            imageError.value = error?.data?.message || `Gagal mengunggah ${file.name}`
        }
    }
}

const removeImage = async (id) => {
    const image = form.images.find(img => img.id === id)
    if (!image || image.isDeleting) return

    image.isDeleting = true

    try {
        await deleteImage(noteId.value, id)
        if (image.src) URL.revokeObjectURL(image.src)
        form.images = form.images.filter(img => img.id !== id)
    } catch (error) {
        image.isDeleting = false
        imageError.value = error?.data?.message || 'Gagal menghapus gambar.'
    }
}

const handleDelete = async () => {
    const confirmed = confirm('Hapus catatan ini? Tindakan ini tidak bisa dibatalkan.')
    if (!confirmed) return

    try {
        await deleteNote(noteId.value)
        notifyNotesChanged()
        router.push('/notes')
    } catch (error) {
        saveError.value = error?.data?.message || 'Gagal menghapus catatan.'
    }
}
</script>