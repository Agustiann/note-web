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
            <input type="text" placeholder="Cari catatan..." />
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
        </div>
        <div class="dashboard__group-list">
          <NuxtLink v-for="note in recent" :key="note.id" to="/notes/update" class="dashboard__note-link">
            <NoteCard :note="note" />
          </NuxtLink>
        </div>
      </section>
    </div>
  </NuxtLayout>
</template>

<script setup>
definePageMeta({ layout: 'default' })

const folderPalette = {
  kerja: { name: 'Kerja', color: '#7b6ef6', softColor: '#edebfe' },
  pribadi: { name: 'Pribadi', color: '#2fbf8f', softColor: '#e2f7f0' },
  belajar: { name: 'Belajar', color: '#ffb020', softColor: '#fff3e0' },
}

const notes = [
  {
    id: 1,
    title: 'Riset kompetitor UI dashboard',
    content: 'Kumpulkan referensi tampilan dashboard dari beberapa produk sejenis sebelum mulai desain.',
    updatedAt: '2 jam lalu',
    folder: folderPalette.kerja,
    checklists: [
      { id: 1, title: 'Cari referensi', is_completed: true },
      { id: 2, title: 'Screenshot tiap referensi', is_completed: true },
      { id: 3, title: 'Rangkum pola umum', is_completed: false },
    ],
    images: [{ id: 1 }, { id: 2 }],
  },
  {
    id: 2,
    title: 'Checklist belanja bulanan',
    content: 'Daftar kebutuhan rumah tangga yang harus dibeli sebelum akhir pekan.',
    updatedAt: 'Kemarin',
    folder: folderPalette.pribadi,
    checklists: [
      { id: 4, title: 'Beras & minyak', is_completed: true },
      { id: 5, title: 'Sabun cuci', is_completed: false },
    ],
    images: [],
  },
  {
    id: 3,
    title: 'Ringkasan kuliah basis data',
    content: 'Normalisasi tabel, relasi one-to-many, dan contoh kasus ERD untuk tugas akhir.',
    updatedAt: '3 hari lalu',
    folder: folderPalette.belajar,
    checklists: [
      { id: 6, title: 'Baca bab 4', is_completed: true },
      { id: 7, title: 'Kerjakan latihan soal', is_completed: true },
      { id: 8, title: 'Review dengan kelompok', is_completed: true },
    ],
    images: [{ id: 3 }],
  },
  {
    id: 4,
    title: 'Ide fitur aplikasi Folio',
    content: 'Tambahkan reminder, label warna folder, dan mode gelap.',
    updatedAt: '5 hari lalu',
    folder: folderPalette.kerja,
    checklists: [],
    images: [],
  },
]

const unfinished = computed(() =>
  notes.filter((n) => n.checklists.some((c) => !c.is_completed))
)
const recent = computed(() => [...notes])
</script>