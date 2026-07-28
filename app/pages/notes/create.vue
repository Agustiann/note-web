<template>
    <div class="update-note">
        <div class="update-note__header">
            <div class="update-note__header-actions">
                <button class="update-note__delete" type="button" @click="handleCancel">
                    Batal
                </button>
                <button class="update-note__save" type="button" :disabled="isSaving" @click="handleSave">
                    {{ isSaving ? 'Menyimpan...' : 'Simpan Catatan' }}
                </button>
            </div>
        </div>

        <div class="update-note__card">
            <div class="update-note__meta">
                <NoteFolderSelect v-model:folder-id="form.folderId" :folders="folders ?? []" />
                <span v-if="foldersError" class="update-note__error-inline">
                    Gagal memuat folder
                </span>
            </div>

            <input v-model="form.title" class="update-note__title-input" placeholder="Judul...">

            <NoteImageSection
                :images="form.images"
                :max-images="MAX_IMAGES"
                :max-size-label="MAX_IMAGE_SIZE_LABEL"
                :error="imageError"
                extra-hint="Gambar akan diunggah setelah catatan disimpan."
                @select-files="handleImageSelected"
                @remove="removeImage"
            />

            <div class="update-note__section">
                <textarea id="note-content" v-model="form.content" class="update-note__textarea" rows="6"
                    placeholder="Tulis catatan di sini..." />
            </div>

            <NoteChecklistSection ref="checklistSectionRef" :items="form.checklist"
                hint="Checklist akan disimpan setelah catatan dibuat." @enter="handleChecklistEnter"
                @blur="handleChecklistBlur" @remove="removeChecklistItem" />

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
useHead({ title: 'Create · Notes' })

const router = useRouter()
const toast = useAppToast()
const { fetchFolders } = useFolders()
const { createNote } = useNotes()
const { uploadImage } = useNoteImages()
const { createChecklistItem } = useNoteChecklists()
const { notifyNotesChanged } = useNotesSync()

const { data: folders, error: foldersError } = await useAsyncData('note-folders', () => fetchFolders())

const checklistSectionRef = ref(null)

const form = reactive({
    title: '',
    folderId: null,
    content: '',
    checklist: [],
    images: [],
})

const isSaving = ref(false)
const saveError = ref('')
const imageError = ref('')

const removeChecklistItem = (id) => {
    form.checklist = form.checklist.filter(item => item.id !== id)
}

const handleChecklistEnter = (item) => {
    if (!item.content.trim()) return
    checklistSectionRef.value?.addItem()
}

const handleChecklistBlur = (item) => {
    if (!item.content.trim()) {
        removeChecklistItem(item.id)
    }
}

const handleImageSelected = (fileList) => {
    const files = Array.from(fileList)
    imageError.value = ''

    for (const file of files) {
        if (form.images.length >= MAX_IMAGES) {
            imageError.value = `Maksimal ${MAX_IMAGES} gambar`
            break
        }

        if (!file.type.startsWith('image/')) {
            imageError.value = `${file.name} bukan file gambar`
            continue
        }

        if (file.size > MAX_IMAGE_SIZE) {
            imageError.value = `${file.name} melebihi batas ${MAX_IMAGE_SIZE_LABEL}`
            continue
        }

        form.images.push({
            id: useTempId(),
            name: file.name,
            src: URL.createObjectURL(file),
            file,
        })
    }
}

const removeImage = (id) => {
    const target = form.images.find(image => image.id === id)
    if (target) URL.revokeObjectURL(target.src)
    form.images = form.images.filter(image => image.id !== id)
}

onBeforeUnmount(() => {
    form.images.forEach(image => URL.revokeObjectURL(image.src))
})

const handleSave = async () => {
    if (!form.title.trim()) {
        saveError.value = 'Judul catatan tidak boleh kosong'
        return
    }

    saveError.value = ''
    isSaving.value = true

    try {
        const note = await createNote({
            title: form.title.trim(),
            content: form.content?.trim() || null,
            folder_id: form.folderId,
        })

        const uploadResults = await Promise.allSettled(
            form.images.map(image => uploadImage(note.id, image.file))
        )
        const failedUploads = uploadResults
            .map((result, i) => (result.status === 'rejected' ? form.images[i].name : null))
            .filter(Boolean)

        const validChecklist = form.checklist.filter(item => item.content.trim())
        const checklistResults = await Promise.allSettled(
            validChecklist.map(item => createChecklistItem(note.id, item.content.trim(), item.isCompleted))
        )
        const failedChecklists = checklistResults
            .map((result, i) => (result.status === 'rejected' ? validChecklist[i].content.trim() : null))
            .filter(Boolean)

        notifyNotesChanged()

        if (failedUploads.length || failedChecklists.length) {
            const parts = []
            if (failedUploads.length) parts.push(`gambar: ${failedUploads.join(', ')}`)
            if (failedChecklists.length) parts.push(`checklist: ${failedChecklists.join(', ')}`)
            toast.error(`Catatan tersimpan, tapi gagal menyimpan ${parts.join('; ')}`)
        } else {
            toast.success('Catatan berhasil disimpan')
        }

        router.push('/notes')
    } catch (error) {
        saveError.value = error?.data?.errors?.title?.[0]
            || error?.data?.message
            || 'Gagal membuat catatan, coba lagi'
        toast.error(saveError.value)
    } finally {
        isSaving.value = false
    }
}

const handleCancel = () => {
    router.push('/notes')
}
</script>