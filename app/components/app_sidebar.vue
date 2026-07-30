<template>
    <aside class="sidebar" :class="{ 'sidebar--open': isSidebarOpen }">
        <button type="button" class="sidebar__close" aria-label="Tutup menu" @click="closeSidebar">
            <X :size="18" />
        </button>

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
                    <LayoutGrid class="sidebar__icon" :size="18" />
                    Dashboard
                </NuxtLink>
                <NuxtLink to="/notes" class="sidebar__nav-item" active-class="sidebar__nav-item--active">
                    <List class="sidebar__icon" :size="18" />
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
                            <FolderPlus :size="18" />
                        </button>
                        <button class="sidebar__folder-add sidebar__folder-add--sm" type="button"
                            title="Catatan baru..." @click="startAddUnfiledNote">
                            <FilePlus :size="16" />
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
                                <Folder class="sidebar__folder-icon" :size="18" />

                                <template v-if="folder.isNew || folder.isRenaming">
                                    <input :ref="(el) => setFolderInputRef(el, folder.id)"
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

                            <div v-if="!folder.isNew && !folder.isRenaming" :ref="(el) => setFolderMenuRef(el, folder.id)"
                                class="sidebar__folder-menu">
                                <button class="sidebar__folder-menu-trigger" type="button" aria-label="Opsi folder"
                                    @click.stop="toggleFolderMenu(folder.id)">
                                    <MoreVertical :size="16" />
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
                                        <FileText class="sidebar__note-icon" :size="16" />
                                        <span>{{ note.title }}</span>
                                    </NuxtLink>
                                </li>
                                <li v-if="creatingNoteFolderId === folder.id" class="sidebar__note-item">
                                    <div class="sidebar__note sidebar__note--input">
                                        <FileText class="sidebar__note-icon" :size="16" />
                                        <input :ref="(el) => setNoteInputRef(el, folder.id)" v-model="noteInputValue" class="sidebar__note-input"
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
                            <FileText class="sidebar__note-icon" :size="16" />
                            <span>{{ note.title }}</span>
                        </NuxtLink>
                    </li>

                    <li v-if="isAddingUnfiledNote" class="sidebar__note-item sidebar__note-item--flat">
                        <div class="sidebar__note sidebar__note--flat sidebar__note--input">
                            <FileText class="sidebar__note-icon" :size="16" />
                            <input ref="unfiledNoteInputRef" v-model="noteInputValue" class="sidebar__note-input"
                                placeholder="Judul catatan..." @click.stop @keyup.enter="confirmUnfiledNoteInput"
                                @keyup.esc="cancelNoteInput" @blur="confirmUnfiledNoteInput">
                        </div>
                    </li>
                </ul>

            </div>

        </div>

        <div class="sidebar__user" ref="userMenuRef">
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

        <div ref="dragPreviewRef" class="drag-preview" aria-hidden="true"></div>

    </aside>
</template>
<script setup>
import { LayoutGrid, List, FolderPlus, FilePlus, Folder, MoreVertical, FileText, X } from 'lucide-vue-next'

const emit = defineEmits(['note-moved'])

const route = useRoute()
const activeNoteId = computed(() => route.params.id ?? null)

const { isOpen: isSidebarOpen, close: closeSidebar } = useSidebarUi()
const { user, fetchUser, logout, fetchPhotoBlobUrl } = useAuth()
const { fetchFolders, createFolder, updateFolder, deleteFolder: deleteFolderApi } = useFolders()
const { version: foldersSyncVersion, lastEvent: foldersLastEvent, notifyFoldersChanged } = useFoldersSync()
const { fetchNotes, moveNote, createNote } = useNotes()
const { version: notesSyncVersion, lastEvent: notesLastEvent, notifyNotesChanged } = useNotesSync()

const toast = useAppToast()

const {
    data: sidebarData,
    error: sidebarError,
    refresh: refreshSidebarData,
} = await useAsyncData('sidebar-data', async () => {
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

    return {
        folders: folders.map(folder => ({
            ...folder,
            notes: (notesByFolder.get(folder.id) ?? []).sort(byName),
            isNew: false,
            isRenaming: false,
        })),
        unfiled: unfiled.sort(byName),
    }
})

const loadError = computed(() => {
    if (!sidebarError.value) return ''
    return sidebarError.value?.data?.message || 'Gagal memuat data.'
})

const localFolders = ref([])
const unfiledNotes = ref([])

watch(sidebarData, (value) => {
    localFolders.value = value?.folders ?? []
    unfiledNotes.value = value?.unfiled ?? []
}, { immediate: true })

const byTitle = (a, b) => a.title.localeCompare(b.title, 'id', { sensitivity: 'base' })

const findNoteLocation = (noteId) => {
    for (const folder of localFolders.value) {
        const idx = folder.notes.findIndex(n => n.id === noteId)
        if (idx !== -1) return folder.notes
    }
    const idx = unfiledNotes.value.findIndex(n => n.id === noteId)
    if (idx !== -1) return unfiledNotes.value
    return null
}

const removeNoteLocally = (noteId) => {
    const list = findNoteLocation(noteId)
    if (!list) return
    const idx = list.findIndex(n => n.id === noteId)
    if (idx !== -1) list.splice(idx, 1)
}

const insertNoteSorted = (list, note) => {
    const idx = list.findIndex(n => byTitle(n, note) > 0)
    if (idx === -1) list.push(note)
    else list.splice(idx, 0, note)
}

const upsertNoteLocally = (note) => {
    removeNoteLocally(note.id)

    if (note.folder_id === null || note.folder_id === undefined) {
        insertNoteSorted(unfiledNotes.value, note)
        return
    }

    const folder = localFolders.value.find(f => f.id === note.folder_id)
    if (!folder) {
        refreshSidebarData()
        return
    }
    insertNoteSorted(folder.notes, note)
}

const handleNoteEvent = (event) => {
    if (event?.type === 'update' || event?.type === 'create' || event?.type === 'note') {
        upsertNoteLocally(event.note)
        return
    }

    if (event?.type === 'delete') {
        removeNoteLocally(event.noteId)
        return
    }

    refreshSidebarData()
}

watch(notesSyncVersion, () => handleNoteEvent(notesLastEvent.value))

watch(foldersSyncVersion, () => {
    const event = foldersLastEvent.value
    if (event?.type === 'note') handleNoteEvent(event)
})

await useAsyncData('sidebar-user', async () => {
    if (!user.value) {
        await fetchUser()
    }
    return true
})

const openedFolders = ref([])
const openedMenuId = ref(null)
const isUserMenuOpen = ref(false)

const { src: photoSrc, loadFrom: loadPhoto, revoke: revokePhoto } = useBlobImage()

const userMenuRef = ref(null)
const noteInputRefs = new Map()
const setNoteInputRef = (el, folderId) => {
    if (el) noteInputRefs.set(folderId, el)
    else noteInputRefs.delete(folderId)
}
const unfiledNoteInputRef = ref(null)

const folderInputRefs = new Map()
const setFolderInputRef = (el, id) => {
    if (el) folderInputRefs.set(id, el)
    else folderInputRefs.delete(id)
}
const focusFolderInput = (id) => {
    nextTick(() => folderInputRefs.get(id)?.focus())
}

const folderMenuRefs = new Map()
const setFolderMenuRef = (el, id) => {
    if (el) folderMenuRefs.set(id, el)
    else folderMenuRefs.delete(id)
}

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

onClickOutside(userMenuRef, closeUserMenu)
onClickOutside(() => folderMenuRefs.get(openedMenuId.value), closeFolderMenu)

watch(user, async (newUser) => {
    if (!newUser?.photo) {
        revokePhoto()
        return
    }

    try {
        await loadPhoto(() => fetchPhotoBlobUrl(newUser.photo))
    } catch (error) {
        revokePhoto()
    }
}, { immediate: true })

const addFolder = () => {
    if (isCreatingFolder.value) return

    tempFolderId.value = useTempId()
    folderInputValue.value = ''

    localFolders.value.push({
        id: tempFolderId.value,
        name: '',
        notes: [],
        isNew: true,
        isRenaming: false,
    })

    isCreatingFolder.value = true

    focusFolderInput(tempFolderId.value)
}

const startRenameFolder = (folder) => {
    closeFolderMenu()
    renamingFolderId.value = folder.id
    folderInputValue.value = folder.name
    folder.isRenaming = true

    focusFolderInput(folder.id)
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
            toast.created()
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
                    toast.updated()
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
        toast.deleted()
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
        noteInputRefs.get(folder.id)?.focus()
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
        const note = await createNote({ title, folder_id: folderId })
        notifyNotesChanged({ type: 'create', note })
    } catch (error) {
        toast.error(error?.data?.errors?.title?.[0] || error?.data?.message || 'Gagal membuat catatan.')
    } finally {
        cancelNoteInput()
    }
}

const startAddUnfiledNote = () => {
    closeFolderMenu()
    isAddingUnfiledNote.value = true
    noteInputValue.value = ''
    nextTick(() => {
        unfiledNoteInputRef.value?.focus()
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
        const note = await createNote({ title, folder_id: null })
        notifyNotesChanged({ type: 'create', note })
    } catch (error) {
        toast.error(error?.data?.errors?.title?.[0] || error?.data?.message || 'Gagal membuat catatan.')
    } finally {
        cancelNoteInput()
    }
}

const draggedNote = ref(null)
const dragOverFolderId = ref(null)
const isDragOverUnfiled = ref(false)
const dragPreviewRef = ref(null)

const handleNoteDragStart = (note, sourceFolderId, event) => {
    draggedNote.value = { noteId: note.id, sourceFolderId }

    if (event?.dataTransfer && dragPreviewRef.value) {
        event.dataTransfer.setData('text/plain', note.title)

        dragPreviewRef.value.textContent = note.title
        event.dataTransfer.setDragImage(dragPreviewRef.value, 10, 10)
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
        const movedResult = await moveNote(noteId, targetFolderId)
        emit('note-moved', { noteId, fromFolderId: sourceFolderId, toFolderId: targetFolderId })
        notifyNotesChanged({ type: 'update', note: movedResult })
    } catch (error) {
        const target = getFolderNotesRef(targetFolderId)
        const revertIndex = target?.findIndex(n => n.id === noteId) ?? -1
        if (target && revertIndex > -1) target.splice(revertIndex, 1)
        movedNote.folder_id = sourceFolderId
        putNoteBack(movedNote, sourceFolderId)
        toast.error(error?.data?.message || 'Gagal memindahkan catatan.')
    }
}

const totalNotes = computed(() => {
    const inFolders = localFolders.value.reduce((total, folder) => total + folder.notes.length, 0)
    return inFolders + unfiledNotes.value.length
})

const userInitials = computed(() => getInitials(user.value?.name))
</script>