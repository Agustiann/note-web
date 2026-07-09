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

                <div class="sidebar__section-header">
                    <p class="sidebar__section-title">
                        Folder
                    </p>
                </div>
                <ul class="sidebar__folders">

                    <li v-for="folder in localFolders" :key="folder.id" class="sidebar__folder-group">
                        <div class="sidebar__folder-row">
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
                                <li v-for="note in folder.notes" :key="note.id">
                                    <NuxtLink to="/notes/update" class="sidebar__note"
                                        active-class="sidebar__note--active">
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
                </ul>

                <button class="sidebar__folder-add" type="button" @click="addFolder">
                    + Tambah Folder
                </button>

            </div>

        </div>

        <div class="sidebar__user">

            <div class="sidebar__avatar">
                {{ userInitial }}
            </div>

            <div class="sidebar__user-meta">
                <p class="sidebar__user-name">
                    {{ user.name }}
                </p>

                <p class="sidebar__user-email">
                    {{ user.email }}
                </p>
            </div>

        </div>

    </aside>
</template>
<script setup>
const props = defineProps({
    folders: {
        type: Array,
        default: () => ([
            {
                id: 1,
                name: 'Kerja',
                notes: [
                    { id: 1, title: 'Meeting Senin' },
                    { id: 2, title: 'Target Bulanan' },
                    { id: 3, title: 'Laporan Progress' },
                ],
            },
            {
                id: 2,
                name: 'Pribadi',
                notes: [
                    { id: 4, title: 'Belanja Bulanan' },
                    { id: 5, title: 'Wishlist Laptop' },
                ],
            },
            {
                id: 3,
                name: 'Belajar',
                notes: [
                    { id: 6, title: 'Nuxt 4' },
                    { id: 7, title: 'Laravel API' },
                    { id: 8, title: 'Design Pattern' },
                ],
            },
        ]),
    },

    user: {
        type: Object,
        default: () => ({
            name: 'Ardiansyah',
            email: 'ardi@folio.app',
        }),
    },
})

const localFolders = ref(
    props.folders.map(folder => ({
        ...folder,
        notes: [...folder.notes],
        isNew: false,
        isRenaming: false,
    }))
)

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

const confirmFolderInput = () => {
    const name = folderInputValue.value.trim()

    if (isCreatingFolder.value) {
        const index = localFolders.value.findIndex(folder => folder.id === tempFolderId.value)
        if (index === -1) return

        if (name === '') {
            localFolders.value.splice(index, 1)
        } else {
            localFolders.value[index].name = name
            localFolders.value[index].isNew = false
        }

        isCreatingFolder.value = false
        tempFolderId.value = null
        folderInputValue.value = ''
        return
    }

    if (renamingFolderId.value !== null) {
        const folder = localFolders.value.find(f => f.id === renamingFolderId.value)
        if (folder) {
            if (name !== '') folder.name = name
            folder.isRenaming = false
        }
        renamingFolderId.value = null
        folderInputValue.value = ''
    }
}

const deleteFolder = (id) => {
    closeFolderMenu()

    const folder = localFolders.value.find(f => f.id === id)
    if (!folder) return

    const confirmed = confirm(`Hapus folder "${folder.name}"? Semua catatan di dalamnya akan ikut terhapus.`)
    if (!confirmed) return

    localFolders.value = localFolders.value.filter(f => f.id !== id)

    const openedIndex = openedFolders.value.indexOf(id)
    if (openedIndex > -1) openedFolders.value.splice(openedIndex, 1)
}

const totalNotes = computed(() => {
    return localFolders.value.reduce((total, folder) => {
        return total + folder.notes.length
    }, 0)
})

const userInitial = computed(() => {
    return props.user.name.charAt(0).toUpperCase()
})
</script>