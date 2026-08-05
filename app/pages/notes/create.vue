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
                :images="noteImages"
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

const toast = useAppToast()
const { fetchFolders } = useFolders()
const { createNote } = useNotes()
const { notifyNotesChanged } = useNotesSync()
const { notifyFoldersChanged } = useFoldersSync()

const { data: folders, error: foldersError } = await useAsyncData('note-folders', () => fetchFolders())

const checklistSectionRef = ref(null)

const form = reactive({
    title: '',
    folderId: null,
    content: '',
    checklist: [],
})
const { items: noteImages, add: addNoteImage, remove: removeNoteImage } = useBlobImageList()

const isSaving = ref(false)
const saveError = ref('')
const imageError = ref('')
const skipGuard = ref(false)

const isDirty = computed(() =>
    !!form.title.trim()
    || !!form.content?.trim()
    || form.checklist.some(item => item.content.trim())
    || noteImages.value.length > 0
)

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
        if (noteImages.value.length >= MAX_IMAGES) {
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

        addNoteImage(useTempId(), file)
    }
}

const removeImage = (id) => {
    removeNoteImage(id)
}

const performSave = async () => {
    if (!form.title.trim()) {
        saveError.value = 'Judul catatan tidak boleh kosong'
        return false
    }

    saveError.value = ''
    isSaving.value = true

    try {
        const validChecklist = form.checklist
            .filter(item => item.content.trim())
            .map(item => ({ content: item.content.trim(), is_completed: item.isCompleted }))

        const note = await createNote({
            title: form.title.trim(),
            content: form.content?.trim() || null,
            folder_id: form.folderId,
            images: noteImages.value.map(image => image.file),
            checklists: validChecklist,
        })

        if (note.folder_id) {
            notifyFoldersChanged({ type: 'note', note })
        } else {
            notifyNotesChanged({ type: 'create', note })
        }

        toast.created('Catatan berhasil disimpan')

        return true
    } catch (error) {
        saveError.value = error?.data?.errors?.title?.[0]
            || error?.data?.message
            || 'Gagal membuat catatan, coba lagi'
        toast.error(saveError.value)
        return false
    } finally {
        isSaving.value = false
    }
}

const handleSave = async () => {
    const saved = await performSave()
    if (saved) {
        skipGuard.value = true
        await navigateTo('/notes')
    }
}

const handleCancel = async () => {
    skipGuard.value = true
    await navigateTo('/notes')
}

useUnsavedChangesGuard(
    () => !skipGuard.value && isDirty.value,
    performSave
)
</script>