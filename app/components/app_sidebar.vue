<template>
    <aside class="sidebar">
        <div class="sidebar__brand">
            <div class="sidebar__logo">
                <img src="/assets/images/logo.png" alt="Notes">
            </div>
            <span class="sidebar__brand-name">Notes</span>
        </div>
        <NuxtLink to="/notes/create" class="sidebar__cta">
            <span class="sidebar__cta-icon">+</span>
            Catatan Baru
        </NuxtLink>
        <div class="sidebar__content">
            <nav class="sidebar__nav">
                <NuxtLink to="/dashboard" class="sidebar__nav-item" active-class="sidebar__nav-item--active">
                    <svg class="sidebar__icon" viewBox="0 0 20 20" fill="none">
                        <rect x="2.5" y="2.5" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.5" />
                        <rect x="11.5" y="2.5" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.5" />
                        <rect x="2.5" y="11.5" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.5" />
                        <rect x="11.5" y="11.5" width="6" height="6" rx="1.5" stroke="currentColor"
                            stroke-width="1.5" />
                    </svg>
                    Dashboard
                </NuxtLink>
                <NuxtLink to="/notes" class="sidebar__nav-item" active-class="sidebar__nav-item--active">
                    <svg class="sidebar__icon" viewBox="0 0 20 20" fill="none">
                        <path d="M4 3.5h12M4 8h12M4 12.5h8" stroke="currentColor" stroke-width="1.5"
                            stroke-linecap="round" />
                    </svg>
                    Semua Catatan
                    <span class="sidebar__nav-count">
                        {{ totalNotes }}
                    </span>
                </NuxtLink>

            </nav>
            <div class="sidebar__section">
                <div class="sidebar__section-header"
                    :class="{ 'sidebar__section-header--drop-target': isDragOverUnfiled }"
                    @dragover.prevent="handleUnfiledDragOver" @dragleave="handleUnfiledDragLeave"
                    @drop.prevent="handleFolderDrop(null)">
                    <p class="sidebar__section-title">
                        Folder
                    </p>
                </div>

                <p v-if="loadError" class="update-note__error">{{ loadError }}</p>

                <ul class="sidebar__folders">
                    <li v-for="folder in localFolders" :key="folder.id" class="sidebar__folder-group">
                        <div class="sidebar__folder-row"
                            :class="{ 'sidebar__folder-row--drop-target': dragOverFolderId === folder.id }"
                            @dragover.prevent="handleFolderDragOver(folder.id)"
                            @dragleave="handleFolderDragLeave(folder.id)" @drop.prevent="handleFolderDrop(folder.id)">
                            <button class="sidebar__folder" @click="toggleFolder(folder.id)">
                                <svg class="sidebar__folder-icon" viewBox="0 0 24 24" fill="none">
                                    <path
                                        d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z"
                                        stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
                                </svg>

                                <template v-if="folder.isNew || folder.isRenaming">
                                    <input :id="folder.isNew ? 'new-folder-input' : `rename-folder-${folder.id}`"
                                        v-model="folderInputValue" class="sidebar__folder-input"
                                        placeholder="Nama folder..." @click.stop @keyup.enter="confirmFolderInput"
                                        @keyup.esc="cancelFolderInput" @blur="confirmFolderInput">
                                </template>

                                <template v-else>
                                    <span class="sidebar__folder-name">
                                        {{ folder.name }}
                                    </span>
                                </template>
                            </button>

                            <div v-if="!folder.isNew && !folder.isRenaming" class="sidebar__folder-menu">
                                <button class="sidebar__folder-menu-trigger" type="button" aria-label="Opsi folder"
                                    @click.stop="toggleFolderMenu(folder.id)">
                                    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                                        <circle cx="10" cy="4" r="1.6" />
                                        <circle cx="10" cy="10" r="1.6" />
                                        <circle cx="10" cy="16" r="1.6" />
                                    </svg>
                                </button>

                                <Transition name="fade">
                                    <ul v-if="openedMenuId === folder.id" class="sidebar__folder-dropdown">
                                        <li>
                                            <button type="button" class="sidebar__folder-dropdown-item"
                                                @click.stop="startRenameFolder(folder)">
                                                Ganti nama
                                            </button>
                                        </li>
                                        <li>
                                            <button type="button"
                                                class="sidebar__folder-dropdown-item sidebar__folder-dropdown-item--danger"
                                                @click.stop="deleteFolder(folder.id)">
                                                Hapus
                                            </button>
                                        </li>
                                    </ul>
                                </Transition>
                            </div>
                        </div>

                        <Transition name="fade">
                            <ul v-if="openedFolders.includes(folder.id)" class="sidebar__notes">
                                <li v-for="note in folder.notes" :key="note.id" class="sidebar__note-item"
                                    :class="{ 'sidebar__note-item--dragging': draggedNote?.noteId === note.id }"
                                    draggable="true" @dragstart="handleNoteDragStart(note, folder.id, $event)"
                                    @dragend="handleNoteDragEnd">
                                    <NuxtLink :to="`/notes/update?id=${note.id}`" class="sidebar__note"
                                        :class="{ 'sidebar__note--active': activeNoteId === note.id }">
                                        <svg class="sidebar__note-icon" viewBox="0 0 24 24" fill="none">
                                            <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
                                                stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
                                            <path d="M14 3v5h5" stroke="currentColor" stroke-width="1.7"
                                                stroke-linejoin="round" />
                                        </svg>
                                        <span>{{ note.title }}</span>
                                    </NuxtLink>
                                </li>
                            </ul>
                        </Transition>
                    </li>

                    <li v-for="note in unfiledNotes" :key="`unfiled-${note.id}`"
                        class="sidebar__note-item sidebar__note-item--flat"
                        :class="{ 'sidebar__note-item--dragging': draggedNote?.noteId === note.id }"
                        draggable="true" @dragstart="handleNoteDragStart(note, null, $event)"
                        @dragend="handleNoteDragEnd">
                        <NuxtLink :to="`/notes/update?id=${note.id}`" class="sidebar__note sidebar__note--flat"
                            :class="{ 'sidebar__note--active': activeNoteId === note.id }">
                            <svg class="sidebar__note-icon" viewBox="0 0 24 24" fill="none">
                                <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
                                    stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
                                <path d="M14 3v5h5" stroke="currentColor" stroke-width="1.7"
                                    stroke-linejoin="round" />
                            </svg>
                            <span>{{ note.title }}</span>
                        </NuxtLink>
                    </li>
                </ul>

                <button class="sidebar__folder-add" type="button" @click="addFolder">
                    + Tambah Folder
                </button>

            </div>

        </div>

        <div class="sidebar__user">

            <div class="sidebar__avatar">
                {{ userInitials }}
            </div>

            <div class="sidebar__user-meta">
                <p class="sidebar__user-name">
                    {{ user?.name }}
                </p>

                <p class="sidebar__user-email">
                    {{ user?.email }}
                </p>
            </div>

        </div>

    </aside>
</template>
<script setup>
const emit = defineEmits(['note-moved'])

const route = useRoute()
const activeNoteId = computed(() => route.path === '/notes/update' ? route.query.id : null)

const { user, fetchUser } = useAuth()
const { fetchFolders, createFolder, updateFolder, deleteFolder: deleteFolderApi } = useFolders()
const { fetchNotes, moveNote } = useNotes()
const { version: notesSyncVersion } = useNotesSync()

const localFolders = ref([])
const unfiledNotes = ref([])
const isLoadingFolders = ref(false)
const loadError = ref('')

const loadSidebarData = async () => {
    isLoadingFolders.value = true
    loadError.value = ''

    try {
        const [folders, notesResponse] = await Promise.all([
            fetchFolders(),
            fetchNotes(),
        ])

        const notesByFolder = new Map()
        const unfiled = []

        for (const note of notesResponse.data) {
            if (note.folder_id === null || note.folder_id === undefined) {
                unfiled.push(note)
                continue
            }
            if (!notesByFolder.has(note.folder_id)) notesByFolder.set(note.folder_id, [])
            notesByFolder.get(note.folder_id).push(note)
        }

        localFolders.value = folders.map(folder => ({
            ...folder,
            notes: notesByFolder.get(folder.id) ?? [],
            isNew: false,
            isRenaming: false,
        }))
        unfiledNotes.value = unfiled
    } catch (error) {
        loadError.value = error?.data?.message || 'Gagal memuat data sidebar.'
    } finally {
        isLoadingFolders.value = false
    }
}

onMounted(async () => {
    if (!user.value) {
        await fetchUser()
    }
    await loadSidebarData()
})

watch(notesSyncVersion, () => {
    loadSidebarData()
})

const openedFolders = ref([])
const openedMenuId = ref(null)

const isCreatingFolder = ref(false)
const folderInputValue = ref('')
const tempFolderId = ref(null)
const renamingFolderId = ref(null)

const toggleFolder = (id) => {
    const index = openedFolders.value.indexOf(id)

    if (index > -1) {
        openedFolders.value.splice(index, 1)
    } else {
        openedFolders.value.push(id)
    }
}

const toggleFolderMenu = (id) => {
    openedMenuId.value = openedMenuId.value === id ? null : id
}

const closeFolderMenu = () => {
    openedMenuId.value = null
}

const handleClickOutside = (e) => {
    if (!e.target.closest('.sidebar__folder-menu')) {
        closeFolderMenu()
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside)
})

const addFolder = () => {
    if (isCreatingFolder.value) return

    tempFolderId.value = Date.now()
    folderInputValue.value = ''

    localFolders.value.push({
        id: tempFolderId.value,
        name: '',
        notes: [],
        isNew: true,
        isRenaming: false,
    })

    isCreatingFolder.value = true

    nextTick(() => {
        document.getElementById('new-folder-input')?.focus()
    })
}

const startRenameFolder = (folder) => {
    closeFolderMenu()
    renamingFolderId.value = folder.id
    folderInputValue.value = folder.name
    folder.isRenaming = true

    nextTick(() => {
        document.getElementById(`rename-folder-${folder.id}`)?.focus()
    })
}

const cancelFolderInput = () => {
    if (isCreatingFolder.value) {
        const index = localFolders.value.findIndex(folder => folder.id === tempFolderId.value)
        if (index > -1) localFolders.value.splice(index, 1)
        isCreatingFolder.value = false
        tempFolderId.value = null
    }

    if (renamingFolderId.value !== null) {
        const folder = localFolders.value.find(f => f.id === renamingFolderId.value)
        if (folder) folder.isRenaming = false
        renamingFolderId.value = null
    }

    folderInputValue.value = ''
}

const confirmFolderInput = async () => {
    const name = folderInputValue.value.trim()

    if (isCreatingFolder.value) {
        const index = localFolders.value.findIndex(folder => folder.id === tempFolderId.value)
        if (index === -1) return

        if (name === '') {
            localFolders.value.splice(index, 1)
            isCreatingFolder.value = false
            tempFolderId.value = null
            folderInputValue.value = ''
            return
        }

        try {
            const created = await createFolder(name)
            localFolders.value.splice(index, 1, {
                ...created,
                notes: [],
                isNew: false,
                isRenaming: false,
            })
        } catch (error) {
            localFolders.value.splice(index, 1)
            alert(error?.data?.errors?.name?.[0] || error?.data?.message || 'Gagal membuat folder.')
        }

        isCreatingFolder.value = false
        tempFolderId.value = null
        folderInputValue.value = ''
        return
    }

    if (renamingFolderId.value !== null) {
        const folder = localFolders.value.find(f => f.id === renamingFolderId.value)

        if (folder) {
            if (name !== '' && name !== folder.name) {
                try {
                    const updated = await updateFolder(folder.id, name)
                    folder.name = updated.name
                } catch (error) {
                    alert(error?.data?.errors?.name?.[0] || error?.data?.message || 'Gagal mengubah nama folder.')
                }
            }
            folder.isRenaming = false
        }

        renamingFolderId.value = null
        folderInputValue.value = ''
    }
}

const deleteFolder = async (id) => {
    closeFolderMenu()

    const folder = localFolders.value.find(f => f.id === id)
    if (!folder) return

    const confirmed = confirm(`Hapus folder "${folder.name}"? Semua catatan di dalamnya akan ikut terhapus.`)
    if (!confirmed) return

    try {
        await deleteFolderApi(id)
        localFolders.value = localFolders.value.filter(f => f.id !== id)

        const openedIndex = openedFolders.value.indexOf(id)
        if (openedIndex > -1) openedFolders.value.splice(openedIndex, 1)
    } catch (error) {
        alert(error?.data?.message || 'Gagal menghapus folder.')
    }
}

const draggedNote = ref(null)
const dragOverFolderId = ref(null)
const isDragOverUnfiled = ref(false)

const handleNoteDragStart = (note, sourceFolderId, event) => {
    draggedNote.value = { noteId: note.id, sourceFolderId }

    if (event?.dataTransfer) {
        event.dataTransfer.setData('text/plain', note.title)

        const dragPreview = document.createElement('div')
        dragPreview.className = 'drag-preview'
        dragPreview.textContent = note.title
        document.body.appendChild(dragPreview)
        event.dataTransfer.setDragImage(dragPreview, 10, 10)

        requestAnimationFrame(() => {
            document.body.removeChild(dragPreview)
        })
    }
}

const handleNoteDragEnd = () => {
    draggedNote.value = null
    dragOverFolderId.value = null
    isDragOverUnfiled.value = false
}

const handleFolderDragOver = (folderId) => {
    if (!draggedNote.value) return
    if (draggedNote.value.sourceFolderId === folderId) return
    dragOverFolderId.value = folderId
}

const handleFolderDragLeave = (folderId) => {
    if (dragOverFolderId.value === folderId) {
        dragOverFolderId.value = null
    }
}
const handleUnfiledDragOver = () => {
    if (!draggedNote.value) return
    if (draggedNote.value.sourceFolderId === null) return
    isDragOverUnfiled.value = true
}

const handleUnfiledDragLeave = () => {
    isDragOverUnfiled.value = false
}

const getFolderNotesRef = (folderId) => {
    if (folderId === null) return unfiledNotes.value
    const folder = localFolders.value.find(f => f.id === folderId)
    return folder ? folder.notes : null
}

const putNoteBack = (note, folderId) => {
    const target = getFolderNotesRef(folderId)
    target?.push(note)
    if (folderId !== null && !openedFolders.value.includes(folderId)) {
        openedFolders.value.push(folderId)
    }
}

const handleFolderDrop = async (targetFolderId) => {
    dragOverFolderId.value = null
    isDragOverUnfiled.value = false

    if (!draggedNote.value) return

    const { noteId, sourceFolderId } = draggedNote.value
    draggedNote.value = null

    if (sourceFolderId === targetFolderId) return

    const sourceList = getFolderNotesRef(sourceFolderId)
    if (!sourceList) return

    const index = sourceList.findIndex(n => n.id === noteId)
    if (index === -1) return

    const [movedNote] = sourceList.splice(index, 1)
    movedNote.folder_id = targetFolderId
    putNoteBack(movedNote, targetFolderId)

    try {
        await moveNote(noteId, targetFolderId)
        emit('note-moved', { noteId, fromFolderId: sourceFolderId, toFolderId: targetFolderId })
    } catch (error) {
        const target = getFolderNotesRef(targetFolderId)
        const revertIndex = target?.findIndex(n => n.id === noteId) ?? -1
        if (target && revertIndex > -1) target.splice(revertIndex, 1)
        movedNote.folder_id = sourceFolderId
        putNoteBack(movedNote, sourceFolderId)
        alert(error?.data?.message || 'Gagal memindahkan catatan.')
    }
}

const totalNotes = computed(() => {
    const inFolders = localFolders.value.reduce((total, folder) => total + folder.notes.length, 0)
    return inFolders + unfiledNotes.value.length
})

const userInitials = computed(() => {
    const name = user.value?.name?.trim()
    if (!name) return ''

    const parts = name.split(/\s+/)

    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase()
    }

    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
})
</script>