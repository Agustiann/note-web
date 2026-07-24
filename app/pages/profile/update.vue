<template>
    <NuxtLayout>
        <div class="profile">
            <header class="profile__header">
                <h2>Edit Profil</h2>
            </header>

            <form novalidate @submit.prevent="handleSubmit">
                <div class="profile__body">
                    <div class="profile__card">
                        <div class="profile__avatar-wrapper">
                            <div class="profile__avatar">
                                <img v-if="avatarPreview" :src="avatarPreview" :alt="form.name" class="profile__avatar-img">
                                <span v-else>{{ userInitials }}</span>
                            </div>

                            <button type="button" class="profile__avatar-edit" aria-label="Ubah foto profil"
                                @click="triggerAvatarInput">
                                <Pencil :size="14" />
                            </button>

                            <input ref="avatarInputRef" type="file" accept="image/*" class="profile__avatar-input"
                                @change="onAvatarChange">
                        </div>

                        <span v-if="avatarError" class="error-text is-visible">{{ avatarError }}</span>

                        <div v-if="errorMessage" class="alert-error">
                            {{ errorMessage }}
                        </div>

                        <div class="form-group" :class="{ error: fieldErrors.name }">
                            <label>Nama</label>
                            <input v-model="form.name" type="text" placeholder="Masukkan nama lengkap">
                            <span class="error-text" :class="{ 'is-visible': fieldErrors.name }">{{ fieldErrors.name }}</span>
                        </div>

                        <div class="form-group">
                            <label>Email</label>
                            <input :value="user?.email" type="email" disabled>
                        </div>

                        <div class="form-group" :class="{ error: fieldErrors.password }">
                            <label>Password Baru</label>
                            <div class="password-input">
                                <input v-model="form.password" :type="showPassword ? 'text' : 'password'"
                                    placeholder="Kosongkan jika tidak diubah">
                                <button type="button" class="toggle-password" @click="showPassword = !showPassword">
                                    <Eye v-if="!showPassword" :size="20" />
                                    <EyeClosed v-else :size="20" />
                                </button>
                            </div>
                            <span class="error-text" :class="{ 'is-visible': fieldErrors.password }">{{ fieldErrors.password }}</span>
                        </div>

                        <div class="form-group" :class="{ error: fieldErrors.confirmPassword }">
                            <label>Konfirmasi Password Baru</label>
                            <div class="password-input">
                                <input v-model="form.confirmPassword" :type="showConfirmPassword ? 'text' : 'password'"
                                    placeholder="Ulangi password baru">
                                <button type="button" class="toggle-password"
                                    @click="showConfirmPassword = !showConfirmPassword">
                                    <Eye v-if="!showConfirmPassword" :size="20" />
                                    <EyeClosed v-else :size="20" />
                                </button>
                            </div>
                            <span class="error-text" :class="{ 'is-visible': fieldErrors.confirmPassword }">{{ fieldErrors.confirmPassword }}</span>
                        </div>
                    </div>

                    <div class="profile__actions">
                        <NuxtLink to="/profile" class="profile__logout-btn">Batal</NuxtLink>
                        <button type="submit" class="profile__edit-btn" :disabled="isSubmitting">
                            <span v-if="isSubmitting" class="spinner"></span>
                            <span v-else>Simpan Perubahan</span>
                        </button>
                    </div>
                </div>
            </form>
        </div>
    </NuxtLayout>
</template>

<script setup>
import '~/assets/css/login.scss'
import { Eye, EyeClosed, Pencil } from 'lucide-vue-next'

definePageMeta({ layout: 'default' })

const MAX_AVATAR_SIZE = 2 * 1024 * 1024
const MAX_AVATAR_SIZE_LABEL = '2MB'

const { user, fetchUser, updateProfile, fetchPhotoBlobUrl } = useAuth()
const { errorMessage, handleApiError } = useApiError()
const toast = useAppToast()

const avatarInputRef = ref(null)
const avatarFile = ref(null)
const avatarPreview = ref(null)
const avatarError = ref('')

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isSubmitting = ref(false)
const fieldErrors = ref({})

const form = ref({
    name: '',
    password: '',
    confirmPassword: '',
})

onMounted(async () => {
    if (!user.value) {
        await fetchUser()
    }
    form.value.name = user.value?.name ?? ''

    if (user.value?.photo) {
        avatarPreview.value = await fetchPhotoBlobUrl(user.value.photo)
    }
})

onBeforeUnmount(() => {
    if (avatarPreview.value && avatarPreview.value.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview.value)
    }
})

const userInitials = computed(() => {
    const name = form.value.name?.trim()
    if (!name) return ''

    const parts = name.split(/\s+/)

    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase()
    }

    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
})

const triggerAvatarInput = () => {
    avatarInputRef.value?.click()
}

const onAvatarChange = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    avatarError.value = ''

    if (!file) return

    if (!file.type.startsWith('image/')) {
        avatarError.value = 'File harus berupa gambar.'
        return
    }

    if (file.size > MAX_AVATAR_SIZE) {
        avatarError.value = `Ukuran foto maksimal ${MAX_AVATAR_SIZE_LABEL}.`
        return
    }

    if (avatarPreview.value && avatarPreview.value.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview.value)
    }

    avatarFile.value = file
    avatarPreview.value = URL.createObjectURL(file)
}

function validate() {
    fieldErrors.value = {}

    if (!form.value.name.trim()) {
        fieldErrors.value.name = 'Kolom ini harus diisi!'
    }

    if (form.value.password || form.value.confirmPassword) {
        if (form.value.password.length < 6) {
            fieldErrors.value.password = 'Password minimal 6 karakter.'
        }

        if (!form.value.confirmPassword) {
            fieldErrors.value.confirmPassword = 'Kolom ini harus diisi!'
        } else if (form.value.password !== form.value.confirmPassword) {
            fieldErrors.value.confirmPassword = 'Konfirmasi password tidak sama.'
        }
    }

    return Object.keys(fieldErrors.value).length === 0
}

async function handleSubmit() {
    errorMessage.value = ''

    if (!validate()) return

    isSubmitting.value = true

    try {
        await updateProfile({
            name: form.value.name.trim(),
            password: form.value.password || undefined,
            password_confirmation: form.value.confirmPassword || undefined,
            photo: avatarFile.value,
        })

        toast.info('Profil berhasil diubah!')
        navigateTo('/profile')
    } catch (error) {
        handleApiError(error)
    } finally {
        isSubmitting.value = false
    }
}
</script>