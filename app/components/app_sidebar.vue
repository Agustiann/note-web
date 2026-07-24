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
                        <path d="M4 5.5h12M4 10h12M4 14.5h8" stroke="currentColor" stroke-width="1.5"
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
                    <div class="sidebar__section-actions">
                        <button class="sidebar__folder-add" type="button" title="Folder baru..." @click="addFolder">
                            <svg viewBox="0 0 20 20" fill="none">
                                <path
                                    d="M2.5 5.5C2.5 4.67157 3.17157 4 4 4H7.17157C7.5694 4 7.9509 4.15804 8.23223 4.43934L9.29289 5.5H16C16.8284 5.5 17.5 6.17157 17.5 7V14.5C17.5 15.3284 16.8284 16 16 16H4C3.17157 16 2.5 15.3284 2.5 14.5V5.5Z"
                                    stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
                                <path d="M10 8.5V13M7.5 10.75H12.5" stroke="currentColor" stroke-width="1.5"
                                    stroke-linecap="round" />
                            </svg>
                        </button>
                        <button class="sidebar__folder-add sidebar__folder-add--sm" type="button"
                            title="Catatan baru..." @click="startAddUnfiledNote">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <path d="M14 2v6h6" />
                                <path d="M12 18v-6" />
                                <path d="M9 15h6" />
                            </svg>
                        </button>
                    </div>
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
                                                @click.stop="startAddNote(folder)">
                                                Catatan Baru
                                            </button>
                                        </li>
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
                                <li v-if="creatingNoteFolderId === folder.id" class="sidebar__note-item">
                                    <div class="sidebar__note sidebar__note--input">
                                        <svg class="sidebar__note-icon" viewBox="0 0 24 24" fill="none">
                                            <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
                                                stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
                                            <path d="M14 3v5h5" stroke="currentColor" stroke-width="1.7"
                                                stroke-linejoin="round" />
                                        </svg>
                                        <input id="new-note-input" v-model="noteInputValue" class="sidebar__note-input"
                                            placeholder="Judul catatan..." @click.stop
                                            @keyup.enter="confirmNoteInput(folder.id)" @keyup.esc="cancelNoteInput"
                                            @blur="confirmNoteInput(folder.id)">
                                    </div>
                                </li>
                            </ul>
                        </Transition>
                    </li>

                    <li v-for="note in unfiledNotes" :key="`unfiled-${note.id}`"
                        class="sidebar__note-item sidebar__note-item--flat"
                        :class="{ 'sidebar__note-item--dragging': draggedNote?.noteId === note.id }" draggable="true"
                        @dragstart="handleNoteDragStart(note, null, $event)" @dragend="handleNoteDragEnd">
                        <NuxtLink :to="`/notes/update?id=${note.id}`" class="sidebar__note sidebar__note--flat"
                            :class="{ 'sidebar__note--active': activeNoteId === note.id }">
                            <svg class="sidebar__note-icon" viewBox="0 0 24 24" fill="none">
                                <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
                                    stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
                                <path d="M14 3v5h5" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
                            </svg>
                            <span>{{ note.title }}</span>
                        </NuxtLink>
                    </li>

                    <li v-if="isAddingUnfiledNote" class="sidebar__note-item sidebar__note-item--flat">
                        <div class="sidebar__note sidebar__note--flat sidebar__note--input">
                            <svg class="sidebar__note-icon" viewBox="0 0 24 24" fill="none">
                                <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
                                    stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
                                <path d="M14 3v5h5" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
                            </svg>
                            <input id="new-unfiled-note-input" v-model="noteInputValue" class="sidebar__note-input"
                                placeholder="Judul catatan..." @click.stop @keyup.enter="confirmUnfiledNoteInput"
                                @keyup.esc="cancelNoteInput" @blur="confirmUnfiledNoteInput">
                        </div>
                    </li>
                </ul>

            </div>

        </div>

        <div class="sidebar__user">
            <button type="button" class="sidebar__user-trigger" @click.stop="toggleUserMenu">
                <div class="sidebar__avatar">
                    <img v-if="photoSrc" :src="photoSrc" alt="Foto profil" class="sidebar__avatar-img">
                    <span v-else>{{ userInitials }}</span>
                </div>

                <div class="sidebar__user-meta">
                    <p class="sidebar__user-name">
                        {{ user?.name }}
                    </p>

                    <p class="sidebar__user-email">
                        {{ user?.email }}
                    </p>
                </div>
            </button>

            <Transition name="slide-up">
                <ul v-if="isUserMenuOpen" class="sidebar__folder-dropdown sidebar__user-dropdown">
                    <li>
                        <button type="button" class="sidebar__folder-dropdown-item" @click.stop="goToProfile">
                            Profil
                        </button>
                    </li>
                    <li>
                        <button type="button"
                            class="sidebar__folder-dropdown-item sidebar__folder-dropdown-item--danger"
                            @click.stop="handleLogout">
                            Logout
                        </button>
                    </li>
                </ul>
            </Transition>
        </div>

    </aside>
</template>
<script setup>
const emit = defineEmits(['note-moved'])

const route = useRoute()
const activeNoteId = computed(() => route.path === '/notes/update' ? route.query.id : null)

const { user, fetchUser, logout, fetchPhotoBlobUrl } = useAuth()
const { fetchFolders, createFolder, updateFolder, deleteFolder: deleteFolderApi } = useFolders()
const { notifyFoldersChanged } = useFoldersSync()
const { fetchNotes, moveNote, createNote } = useNotes()
const { version: notesSyncVersion, notifyNotesChanged } = useNotesSync()

const toast = useAppToast()
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

        for (const note of notesResponse.data.notes) {
            if (note.folder_id === null || note.folder_id === undefined) {
                unfiled.push(note)
                continue
            }
            if (!notesByFolder.has(note.folder_id)) notesByFolder.set(note.folder_id, [])
            notesByFolder.get(note.folder_id).push(note)
        }
        const byName = (a, b) => a.title.localeCompare(b.title, 'id', { sensitivity: 'base' })

        localFolders.value = folders.map(folder => ({
            ...folder,
            notes: (notesByFolder.get(folder.id) ?? []).sort(byName),
            isNew: false,
            isRenaming: false,
        }))
        unfiledNotes.value = unfiled.sort(byName)
    } catch (error) {
        loadError.value = error?.data?.message || 'Gagal memuat data.'
    } finally {
        isLoadingFolders.value = false
    }
}

onMounted(async () => {
    if (!user.value) {
        await fetchUser()
    }
    if (user.value?.photo) {
        photoSrc.value = await fetchPhotoBlobUrl(user.value.photo)
    }
    await loadSidebarData()
})

watch(notesSyncVersion, () => {
    loadSidebarData()
})

const openedFolders = ref([])
const openedMenuId = ref(null)
const isUserMenuOpen = ref(false)
const photoSrc = ref(null)

const toggleUserMenu = () => {
    isUserMenuOpen.value = !isUserMenuOpen.value
}

const closeUserMenu = () => {
    isUserMenuOpen.value = false
}

const goToProfile = () => {
    closeUserMenu()
    navigateTo('/profile')
}

const handleLogout = async () => {
    closeUserMenu()
    await logout()
    navigateTo('/auth/login')
}

const isCreatingFolder = ref(false)
const folderInputValue = ref('')
const tempFolderId = ref(null)
const renamingFolderId = ref(null)

const creatingNoteFolderId = ref(null)
const isAddingUnfiledNote = ref(false)
const noteInputValue = ref('')

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
    if (!e.target.closest('.sidebar__user')) {
        closeUserMenu()
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside)
    if (photoSrc.value) URL.revokeObjectURL(photoSrc.value)
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

const sortFoldersByName = () => {
    localFolders.value.sort((a, b) => a.name.localeCompare(b.name, 'id', { sensitivity: 'base' }))
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
            sortFoldersByName()
            notifyFoldersChanged()
            toast.success()
        } catch (error) {
            localFolders.value.splice(index, 1)
            toast.error(error?.data?.errors?.name?.[0] || error?.data?.message || 'Gagal membuat folder.')
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
                    sortFoldersByName()
                    notifyFoldersChanged()
                    toast.info()
                } catch (error) {
                    toast.error(error?.data?.errors?.name?.[0] || error?.data?.message || 'Gagal mengubah nama folder.')
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

    const confirmed = await useConfirmDelete(`Folder "${folder.name}"`)
    if (!confirmed) return

    try {
        await deleteFolderApi(id)
        localFolders.value = localFolders.value.filter(f => f.id !== id)
        const openedIndex = openedFolders.value.indexOf(id)
        if (openedIndex > -1) openedFolders.value.splice(openedIndex, 1)
        notifyFoldersChanged()
        toast.error()
    } catch (error) {
        toast.error(error?.data?.message || 'Gagal menghapus folder.')
    }
}

const startAddNote = (folder) => {
    closeFolderMenu()
    if (!openedFolders.value.includes(folder.id)) {
        openedFolders.value.push(folder.id)
    }
    creatingNoteFolderId.value = folder.id
    noteInputValue.value = ''
    nextTick(() => {
        document.getElementById('new-note-input')?.focus()
    })
}

const cancelNoteInput = () => {
    creatingNoteFolderId.value = null
    isAddingUnfiledNote.value = false
    noteInputValue.value = ''
}

const confirmNoteInput = async (folderId) => {
    if (creatingNoteFolderId.value !== folderId) return
    const title = noteInputValue.value.trim()
    if (title === '') {
        cancelNoteInput()
        return
    }
    try {
        await createNote({ title, folder_id: folderId })
        notifyNotesChanged()
    } catch (error) {
        alert(error?.data?.errors?.title?.[0] || error?.data?.message || 'Gagal membuat catatan.')
    } finally {
        cancelNoteInput()
    }
}

const startAddUnfiledNote = () => {
    closeFolderMenu()
    isAddingUnfiledNote.value = true
    noteInputValue.value = ''
    nextTick(() => {
        document.getElementById('new-unfiled-note-input')?.focus()
    })
}

const confirmUnfiledNoteInput = async () => {
    if (!isAddingUnfiledNote.value) return
    const title = noteInputValue.value.trim()
    if (title === '') {
        cancelNoteInput()
        return
    }
    try {
        await createNote({ title, folder_id: null })
        notifyNotesChanged()
    } catch (error) {
        alert(error?.data?.errors?.title?.[0] || error?.data?.message || 'Gagal membuat catatan.')
    } finally {
        cancelNoteInput()
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