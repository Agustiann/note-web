<template>
    <h2>Buat Akun Baru</h2>

    <p class="subtitle">
        Isi data di bawah untuk mendaftar
    </p>

    <div v-if="errorMessage" class="alert-error">
        {{ errorMessage }}
    </div>

    <form novalidate @submit.prevent="register">
        <div class="form-group" :class="{ error: fieldErrors.name }">
            <label>Nama Lengkap</label>
            <input v-model="form.name" type="text" placeholder="Masukkan nama lengkap">
            <span class="error-text" :class="{ 'is-visible': fieldErrors.name }">{{ fieldErrors.name }}</span>
        </div>

        <div class="form-group" :class="{ error: fieldErrors.email }">
            <label>Email</label>
            <input v-model="form.email" type="email" placeholder="Masukkan email">
            <span class="error-text" :class="{ 'is-visible': fieldErrors.email }">{{ fieldErrors.email }}</span>
        </div>

        <div class="form-group" :class="{ error: fieldErrors.password }">
            <label>Password</label>
            <div class="password-input">
                <input v-model="form.password" :type="showPassword ? 'text' : 'password'"
                    placeholder="Masukkan password">
                <button type="button" class="toggle-password" @click="showPassword = !showPassword">
                    <Eye v-if="!showPassword" :size="20" />
                    <EyeClosed v-else :size="20" />
                </button>
            </div>
            <span class="error-text" :class="{ 'is-visible': fieldErrors.password }">{{ fieldErrors.password }}</span>
        </div>

        <div class="form-group" :class="{ error: fieldErrors.confirmPassword }">
            <label>Konfirmasi Password</label>
            <div class="password-input">
                <input v-model="form.confirmPassword" :type="showConfirmPassword ? 'text' : 'password'"
                    placeholder="Ulangi password">
                <button type="button" class="toggle-password" @click="showConfirmPassword = !showConfirmPassword">
                    <Eye v-if="!showConfirmPassword" :size="20" />
                    <EyeClosed v-else :size="20" />
                </button>
            </div>
            <span class="error-text" :class="{ 'is-visible': fieldErrors.confirmPassword }">{{ fieldErrors.confirmPassword }}</span>
        </div>

        <button type="submit" class="btn-login" :disabled="isSubmitting">
            <span v-if="isSubmitting" class="spinner"></span>
            <span v-else>Daftar</span>
        </button>

        <p class="switch-auth">
            Sudah punya akun?
            <NuxtLink to="/auth/login">Masuk di sini</NuxtLink>
        </p>
    </form>
</template>

<script setup>
definePageMeta({ layout: 'auth' })

import { Eye, EyeClosed } from 'lucide-vue-next'

const { register: registerRequest } = useAuth()
const { errorMessage, handleApiError } = useApiError()
const toast = useAppToast()

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isSubmitting = ref(false)
const fieldErrors = ref({})

const form = reactive({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
})

function validate() {
    fieldErrors.value = {}

    if (!form.name) {
        fieldErrors.value.name = 'Kolom ini harus diisi!'
    }

    const emailError = validateEmail(form.email)
    if (emailError) fieldErrors.value.email = emailError

    if (!form.password) {
        fieldErrors.value.password = 'Kolom ini harus diisi!'
    }

    if (!form.confirmPassword) {
        fieldErrors.value.confirmPassword = 'Kolom ini harus diisi!'
    } else if (form.password !== form.confirmPassword) {
        fieldErrors.value.confirmPassword = 'Konfirmasi password tidak sama.'
    }

    return Object.keys(fieldErrors.value).length === 0
}

async function register() {
    errorMessage.value = ''

    if (!validate()) return

    isSubmitting.value = true

    try {
        await registerRequest({
            name: form.name,
            email: form.email,
            password: form.password,
            password_confirmation: form.confirmPassword,
        })

        toast.success('Registrasi berhasil! Silakan login.')
        await navigateTo('/auth/login')
    } catch (error) {
        handleApiError(error)
    } finally {
        isSubmitting.value = false
    }
}
</script>