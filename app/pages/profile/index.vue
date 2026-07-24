<template>
    <NuxtLayout>
        <div class="profile">
            <header class="profile__header">
                <h2>Profil</h2>
            </header>

            <div v-if="isLoading" class="update-note__loading">
                Memuat profil...
            </div>

            <div v-else class="profile__body">
                <div class="profile__card">
                    <div class="profile__avatar">
                        <img v-if="photoSrc" :src="photoSrc" :alt="user.name" class="profile__avatar-img">
                        <span v-else>{{ userInitials }}</span>
                    </div>

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
                        <span class="profile__value">{{ joinedLabel }}</span>
                    </div>
                </div>

                <div class="profile__actions">
                    <NuxtLink to="/profile/update" class="profile__edit-btn">
                        <Pencil :size="16" />
                        Edit Profil
                    </NuxtLink>
                    <button type="button" class="profile__logout-btn" @click="handleLogout">
                        <LogOut :size="16" />
                        Logout
                    </button>
                </div>
            </div>
        </div>
    </NuxtLayout>
</template>

<script setup>
import { Pencil, LogOut } from 'lucide-vue-next'

definePageMeta({ layout: 'default' })

const { user, fetchUser, logout, fetchPhotoBlobUrl } = useAuth()

const isLoading = ref(true)
const photoSrc = ref(null)

onMounted(async () => {
    try {
        if (!user.value) {
            await fetchUser()
        }
        if (user.value?.photo) {
            photoSrc.value = await fetchPhotoBlobUrl(user.value.photo)
        }
    } finally {
        isLoading.value = false
    }
})

onBeforeUnmount(() => {
    if (photoSrc.value) URL.revokeObjectURL(photoSrc.value)
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

const joinedLabel = computed(() => {
    if (!user.value?.created_at) return '-'
    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'long',
    }).format(new Date(user.value.created_at))
})

const handleLogout = async () => {
    const confirmed = confirm('Yakin ingin logout?')
    if (!confirmed) return

    await logout()
    navigateTo('/auth/login')
}
</script>