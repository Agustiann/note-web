<template>
  <NuxtLayout>
    <div class="dashboard">
      <header class="dashboard__topbar">
        <div class="dashboard__actions">
          <label class="dashboard__search">
            <svg viewBox="0 0 20 20" fill="none" class="dashboard__search-icon">
              <circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.5" />
              <path d="M17 17l-3.5-3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
            <input v-model="search" type="text" placeholder="Cari catatan..." />
          </label>
          <NuxtLink to="/notes/create" class="dashboard__new-btn">
            <span class="sidebar__cta-icon">+</span>
            Catatan Baru
          </NuxtLink>
        </div>
      </header>

      <section class="dashboard__group">
        <div class="dashboard__group-header">
          <h2>Semua Catatan</h2>
          <span v-if="!isLoading">{{ totalAllNotes }} catatan</span>
        </div>

        <p v-if="loadError" class="update-note__error">{{ loadError }}</p>
        <p v-else-if="isLoading">Memuat catatan...</p>
        <p v-else-if="!filteredNotes.length">Belum ada catatan.</p>

        <div v-else class="dashboard__group-list">
          <NuxtLink v-for="note in filteredNotes" :key="note.id" :to="`/notes/update?id=${note.id}`"
            class="dashboard__note-link">
            <NoteCard :note="note" />
          </NuxtLink>
        </div>
      </section>
    </div>
  </NuxtLayout>
</template>

<script setup>
definePageMeta({ layout: 'default' })

const { fetchNotes } = useNotes()

const notes = ref([])
const totalAllNotes = ref(0)
const isLoading = ref(true)
const loadError = ref('')
const search = ref('')

onMounted(async () => {
  isLoading.value = true

  try {
    const response = await fetchNotes()
    notes.value = response.data
    totalAllNotes.value = response.meta.total_all_notes
  } catch (error) {
    loadError.value = error?.data?.message || 'Gagal memuat catatan.'
  } finally {
    isLoading.value = false
  }
})

const filteredNotes = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  if (!keyword) return notes.value

  return notes.value.filter(note =>
    note.title?.toLowerCase().includes(keyword)
    || note.content?.toLowerCase().includes(keyword)
  )
})
</script>