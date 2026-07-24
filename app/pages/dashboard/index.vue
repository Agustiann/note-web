<template>
  <NuxtLayout>
    <div class="dashboard">
      <header class="dashboard__title">
        <div class="dashboard__actions">
          <h2>Dashboard</h2>
        </div>
      </header>

      <section class="dashboard__stats">
        <div v-for="stat in stats" :key="stat.label" class="stat-card">
          <span class="stat-card__label">{{ stat.label }}</span>
          <span class="stat-card__value">{{ stat.value }}</span>
        </div>
      </section>

      <section class="dashboard__group">
        <div class="dashboard__group-header">
          <h2>Catatan terbaru</h2>
          <span class="dashboard__group-count">{{ recent.length }}</span>
        </div>

        <p v-if="loadError" class="update-note__error">{{ loadError }}</p>
        <p v-else-if="isLoading">Memuat catatan...</p>
        <p v-else-if="!recent.length">Belum ada catatan.</p>

        <div v-else class="dashboard__group-list">
          <NuxtLink v-for="note in recent" :key="note.id" :to="`/notes/update?id=${note.id}`"
            class="dashboard__note-link">
            <NoteCard :note="note" date-field="created_at" />
          </NuxtLink>
        </div>
      </section>
    </div>
  </NuxtLayout>
</template>

<script setup>
definePageMeta({ layout: 'default' })

const { fetchNotes } = useNotes()
const { fetchFolders } = useFolders()

const notes = ref([])
const totalAllNotes = ref(0)
const totalFolders = ref(0)
const isLoading = ref(true)
const loadError = ref('')

onMounted(async () => {
  isLoading.value = true
  loadError.value = ''

  try {
    const [notesResponse, folders] = await Promise.all([
      fetchNotes(),
      fetchFolders(),
    ])

    notes.value = notesResponse.data.notes
    totalAllNotes.value = notesResponse.data.total_all_notes
    totalFolders.value = folders.length
  } catch (error) {
    loadError.value = error?.data?.message || 'Gagal memuat data dashboard.'
  } finally {
    isLoading.value = false
  }
})

const recent = computed(() =>
  [...notes.value]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 3)
)

const stats = computed(() => [
  { label: 'Total catatan', value: totalAllNotes.value },
  { label: 'Folder aktif', value: totalFolders.value },
])
</script>