<template>
  <NuxtLayout>
    <div class="profile">
      <header class="profile__header">
        <h2>Profil Saya</h2>
      </header>

      <p v-if="loadError" class="update-note__error">{{ loadError }}</p>
      <p v-else-if="isLoading">Memuat profil...</p>

      <div v-else class="profile__card">
        <div class="profile__avatar">{{ initials }}</div>

        <div class="profile__field">
          <span class="profile__label">Nama</span>
          <span class="profile__value">{{ user?.name }}</span>
        </div>

        <div class="profile__field">
          <span class="profile__label">Email</span>
          <span class="profile__value">{{ user?.email }}</span>
        </div>

        <div class="profile__field">
          <span class="profile__label">Bergabung sejak</span>
          <span class="profile__value">{{ formattedJoinDate }}</span>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
definePageMeta({ layout: 'default' })

const { user, fetchUser } = useAuth()

const isLoading = ref(true)
const loadError = ref('')

onMounted(async () => {
  isLoading.value = true
  loadError.value = ''

  try {
    await fetchUser()
  } catch (error) {
    loadError.value = error?.data?.message || 'Gagal memuat profil.'
  } finally {
    isLoading.value = false
  }
})

const initials = computed(() => {
  const name = user.value?.name?.trim()
  if (!name) return ''

  const parts = name.split(/\s+/)

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase()
  }

  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
})

const formattedJoinDate = computed(() => {
  if (!user.value?.created_at) return '-'

  return new Date(user.value.created_at).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
})
</script>