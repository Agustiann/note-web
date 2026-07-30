<template>
    <div class="profile">
        <header class="profile__header">
            <h2>Edit Profil</h2>
        </header>

        <form novalidate @submit.prevent="onSubmit">
            <div class="profile__body">
                <div class="profile__card">
                    <div class="profile__avatar-wrapper">
                        <div class="profile__avatar">
                            <img v-if="avatarPreview" :src="avatarPreview" :alt="name" class="profile__avatar-img">
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

                    <div class="form-group" :class="{ error: errors.name }">
                        <label>Nama</label>
                        <input v-model="name" type="text" placeholder="Masukkan nama lengkap">
                        <span class="error-text" :class="{ 'is-visible': errors.name }">{{ errors.name }}</span>
                    </div>

                    <div class="form-group">
                        <label>Email</label>
                        <input :value="user?.email" type="email" disabled>
                    </div>

                    <div class="form-group" :class="{ error: errors.password }">
                        <label>Password Baru</label>
                        <div class="password-input">
                            <input v-model="password" :type="showPassword ? 'text' : 'password'"
                                placeholder="Kosongkan jika tidak diubah">
                            <button type="button" class="toggle-password" @click="showPassword = !showPassword">
                                <Eye v-if="!showPassword" :size="20" />
                                <EyeClosed v-else :size="20" />
                            </button>
                        </div>
                        <span class="error-text" :class="{ 'is-visible': errors.password }">{{ errors.password }}</span>
                        <PasswordStrengthMeter :password="password" />
                    </div>

                    <div class="form-group" :class="{ error: errors.confirmPassword }">
                        <label>Konfirmasi Password Baru</label>
                        <div class="password-input">
                            <input v-model="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'"
                                placeholder="Ulangi password baru">
                            <button type="button" class="toggle-password"
                                @click="showConfirmPassword = !showConfirmPassword">
                                <Eye v-if="!showConfirmPassword" :size="20" />
                                <EyeClosed v-else :size="20" />
                            </button>
                        </div>
                        <span class="error-text" :class="{ 'is-visible': errors.confirmPassword }">{{ errors.confirmPassword }}</span>
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
</template>

<script setup>
definePageMeta({ layout: 'default' })
useHead({ title: 'Update · Profile' })

import { Eye, EyeClosed, Pencil } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'

const MAX_AVATAR_SIZE = 2 * 1024 * 1024
const MAX_AVATAR_SIZE_LABEL = '2MB'

const { user, fetchUser, updateProfile, fetchPhotoBlobUrl } = useAuth()
const toast = useAppToast()
const errorMessage = ref('')

const avatarInputRef = ref(null)
const avatarFile = ref(null)
const avatarError = ref('')

const showPassword = ref(false)
const showConfirmPassword = ref(false)

const { defineField, handleSubmit, errors, isSubmitting, setValues } = useForm({
    validationSchema: toTypedSchema(updateProfileSchema),
    initialValues: { name: '', password: '', confirmPassword: '' },
})

const [name] = defineField('name')
const [password] = defineField('password')
const [confirmPassword] = defineField('confirmPassword')

await useAsyncData('profile-update-data', async () => {
    if (!user.value) {
        await fetchUser()
    }
    setValues({ name: user.value?.name ?? '' })
    return true
})

const { src: avatarPreview, loadFrom, setFromFile } = useBlobImage()

onMounted(() => {
    if (user.value?.photo) {
        loadFrom(() => fetchPhotoBlobUrl(user.value.photo))
    }
})

const userInitials = computed(() => getInitials(name.value))

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

    avatarFile.value = file
    setFromFile(file)
}

const onSubmit = handleSubmit(async (values) => {
    errorMessage.value = ''

    try {
        await updateProfile({
            name: values.name,
            password: values.password || undefined,
            password_confirmation: values.confirmPassword || undefined,
            photo: avatarFile.value,
        })

        toast.updated('Profil berhasil diubah!')
        await navigateTo('/profile')
    } catch (error) {
        errorMessage.value = error?.data?.message || 'Terjadi kesalahan, silakan coba lagi.'
    }
})
</script>