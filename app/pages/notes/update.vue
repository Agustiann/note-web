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
                                <span class="update-note__attachment-size">{{ formatSize(image.size) }}</span>
                            </div>
                            <button type="button" class="update-note__attachment-remove" aria-label="Hapus gambar"
                                @click="removeImage(image.id)">
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

const MAX_IMAGES = 3
const MAX_IMAGE_SIZE = 2 * 1024 * 1024
const MAX_IMAGE_SIZE_LABEL = '2MB'

const folders = ref([
    { id: 1, name: 'Kerja' },
    { id: 2, name: 'Pribadi' },
    { id: 3, name: 'Belajar' },
])

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

const fetchDummyNote = async () => {
    return {
        title: 'Meeting Senin',
        folderId: 1,
        content: 'Bahas progress sprint minggu ini dan blocker dari tim design.\nSiapkan slide sebelum jam 10.',
        checklist: [
            { id: 'c1', content: 'Siapkan bahan presentasi', isCompleted: true },
            { id: 'c2', content: 'Konfirmasi jadwal ke tim', isCompleted: false },
        ],
        images: [],
        updatedAt: new Date().toISOString(),
    }
}

onMounted(async () => {
    isLoading.value = true

    try {
        const note = await fetchDummyNote()

        form.title = note.title
        form.folderId = note.folderId
        form.content = note.content
        form.checklist = note.checklist.map(item => ({ ...item, id: item.id || createId() }))
        form.images = (note.images ?? []).map(image => ({ ...image, id: image.id || createId() }))
        lastUpdated.value = new Date(note.updatedAt)
    } finally {
        isLoading.value = false
    }
})

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

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
})

const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    return `${(bytes / 1024).toFixed(1)} KB`
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
            const dataUrl = await readFileAsDataUrl(file)
            form.images.push({
                id: createId(),
                name: file.name,
                size: file.size,
                src: dataUrl,
            })
        } catch {
            imageError.value = `Gagal membaca ${file.name}`
        }
    }
}

const removeImage = (id) => {
    form.images = form.images.filter(image => image.id !== id)
}

const handleSave = async () => {
    if (!form.title.trim()) {
        saveError.value = 'Judul catatan tidak boleh kosong'
        return
    }

    saveError.value = ''
    isSaving.value = true

    try {
        await new Promise(resolve => setTimeout(resolve, 500))
        lastUpdated.value = new Date()
    } catch {
        saveError.value = 'Gagal menyimpan perubahan, coba lagi'
    } finally {
        isSaving.value = false
    }
}

const handleDelete = async () => {
    const confirmed = confirm('Hapus catatan ini? Tindakan ini tidak bisa dibatalkan.')
    if (!confirmed) return

    router.push('/notes')
}
</script>