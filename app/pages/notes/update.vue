<template>
    <NuxtLayout>
        <div class="update-note">

            <div class="update-note__header">
                <div class="update-note__header-actions">
                    <button class="update-note__delete" type="button" @click="handleDelete">
                        Hapus
                    </button>
                    <button class="update-note__save" type="button" :disabled="isSaving" @click="handleSave">
                        {{ isSaving ? 'Menyimpan...' : 'Simpan Perubahan' }}
                    </button>
                </div>
            </div>

            <div v-if="isLoading" class="update-note__loading">
                Memuat catatan...
            </div>

            <div v-else class="update-note__card">

                <div class="update-note__meta">
                    <div class="update-note__field">
                        <label for="note-folder">Folder</label>
                        <select id="note-folder" v-model="form.folderId">
                            <option :value="null">Tanpa folder</option>
                            <option v-for="folder in folders" :key="folder.id" :value="folder.id">
                                {{ folder.name }}
                            </option>
                        </select>
                    </div>
                </div>

                <input v-model="form.title" class="update-note__title-input" placeholder="Judul catatan...">

                <div class="update-note__section">
                    <div class="update-note__section-header">
                        <label>Lampiran Gambar ({{ form.images.length }}/{{ MAX_IMAGES }})</label>
                        <button type="button" class="update-note__section-add" :disabled="!canAddImage"
                            @click="triggerImageUpload">
                            + Tambah gambar
                        </button>
                        <input ref="imageInputRef" type="file" accept="image/*" multiple
                            class="update-note__image-input" @change="handleImageSelected">
                    </div>

                    <p class="update-note__hint">
                        Maksimal {{ MAX_IMAGES }} gambar, masing-masing maksimal {{ MAX_IMAGE_SIZE_LABEL }}.
                    </p>

                    <span v-if="imageError" class="update-note__error">
                        {{ imageError }}
                    </span>

                    <div v-if="form.images.length" class="update-note__attachment-grid">
                        <div v-for="image in form.images" :key="image.id" class="update-note__attachment-item">
                            <img :src="image.src" :alt="image.name" class="update-note__attachment-preview">
                            <div class="update-note__attachment-meta">
                                <span class="update-note__attachment-name">{{ image.name }}</span>
                            </div>
                            <button type="button" class="update-note__attachment-remove" aria-label="Hapus gambar"
                                :disabled="image.isDeleting" @click="removeImage(image.id)">
                                ×
                            </button>
                        </div>
                    </div>
                </div>

                <div class="update-note__section">
                    <div class="update-note__section-header">
                        <label for="note-content">Isi Catatan</label>
                    </div>
                    <textarea id="note-content" v-model="form.content" class="update-note__textarea" rows="6"
                        placeholder="Tulis catatan di sini..." />
                </div>

                <div class="update-note__section">
                    <div class="update-note__section-header">
                        <label>Checklist</label>
                        <button type="button" class="update-note__section-add" @click="addChecklistItem">
                            + Tambah checklist
                        </button>
                    </div>
                    <p class="update-note__hint">
                        Checklist belum tersimpan ke server (belum ada endpoint checklist).
                    </p>
                    <ul v-if="form.checklist.length" class="update-note__checklist">
                        <li v-for="item in form.checklist" :key="item.id" class="update-note__checklist-item"
                            :class="{ 'update-note__checklist-item--done': item.isCompleted }">
                            <input v-model="item.isCompleted" type="checkbox" class="update-note__checklist-checkbox">
                            <input v-model="item.content" type="text" class="update-note__checklist-input"
                                placeholder="Item checklist..." @keyup.enter="addChecklistItem">
                            <button type="button" class="update-note__checklist-remove" aria-label="Hapus item"
                                @click="removeChecklistItem(item.id)">
                                ×
                            </button>
                        </li>
                    </ul>
                    <p v-else class="update-note__empty-hint">
                        Belum ada checklist.
                    </p>
                </div>

                <div class="update-note__footer">
                    <span class="update-note__last-updated">
                        Terakhir diubah: {{ lastUpdatedLabel }}
                    </span>
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
const { fetchNote, updateNote, deleteNote } = useNotes()
const { uploadImage, deleteImage, fetchImageBlobUrl } = useNoteImages()
const { notifyNotesChanged } = useNotesSync()

const folders = ref([])

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
const imageInputRef = ref(null)
const lastUpdated = ref(new Date())

const lastUpdatedLabel = computed(() => {
    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(lastUpdated.value)
})

const createId = () => `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

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
            id: item.id || createId(),
            content: item.content,
            isCompleted: item.is_completed,
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
    } catch (error) {
        saveError.value = error?.data?.message || 'Gagal memuat catatan.'
    } finally {
        isLoading.value = false
    }
}

watch(noteId, (id) => {
    loadNote(id)
}, { immediate: true })

const addChecklistItem = () => {
    form.checklist.push({
        id: createId(),
        content: '',
        isCompleted: false,
    })
}

const removeChecklistItem = (id) => {
    form.checklist = form.checklist.filter(item => item.id !== id)
}

const canAddImage = computed(() => form.images.length < MAX_IMAGES)

const triggerImageUpload = () => {
    if (!canAddImage.value) {
        imageError.value = `Maksimal ${MAX_IMAGES} gambar`
        return
    }
    imageInputRef.value?.click()
}

const handleImageSelected = async (e) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
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

const handleSave = async () => {
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
        notifyNotesChanged()
    } catch (error) {
        saveError.value = error?.data?.errors?.title?.[0]
            || error?.data?.message
            || 'Gagal menyimpan perubahan, coba lagi'
    } finally {
        isSaving.value = false
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