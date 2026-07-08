<template>
    <aside class="sidebar">
        <div class="sidebar__brand">
            <div class="sidebar__logo">
                <img src="/assets/images/logo.png" alt="Notes">
            </div>
            <span class="sidebar__brand-name">Notes</span>
        </div>
        <button class="sidebar__cta" type="button">
            <span class="sidebar__cta-icon">+</span>
            Catatan Baru
        </button>
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
                        <button class="sidebar__folder" @click="toggleFolder(folder.id)">
                            <svg class="sidebar__folder-icon" viewBox="0 0 24 24" fill="none">
                                <path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z"
                                    stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
                            </svg>
                            <template v-if="folder.isNew">
                                <input id="new-folder-input" v-model="newFolderName" class="sidebar__folder-input"
                                    placeholder="Nama folder..." @keyup.enter="saveFolder" @blur="saveFolder">
                            </template>

                            <template v-else>
                                <span class="sidebar__folder-name">
                                    {{ folder.name }}
                                </span>
                            </template>
                            <span class="sidebar__folder-count">
                                {{ folder.notes.length }}
                            </span>
                        </button>
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
    }))
)

const openedFolders = ref([])

const isCreatingFolder = ref(false)
const newFolderName = ref('')
const tempFolderId = ref(null)

const toggleFolder = (id) => {
    const index = openedFolders.value.indexOf(id)

    if (index > -1) {
        openedFolders.value.splice(index, 1)
    } else {
        openedFolders.value.push(id)
    }
}

const addFolder = () => {
    if (isCreatingFolder.value) return

    tempFolderId.value = Date.now()

    localFolders.value.push({
        id: tempFolderId.value,
        name: '',
        notes: [],
        isNew: true,
    })

    isCreatingFolder.value = true

    nextTick(() => {
        document.getElementById('new-folder-input')?.focus()
    })
}

const saveFolder = () => {
    const name = newFolderName.value.trim()

    const index = localFolders.value.findIndex(
        folder => folder.id === tempFolderId.value
    )

    if (index === -1) return

    if (name === '') {
        localFolders.value.splice(index, 1)
    } else {
        localFolders.value[index].name = name
        localFolders.value[index].isNew = false
    }

    newFolderName.value = ''
    tempFolderId.value = null
    isCreatingFolder.value = false
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