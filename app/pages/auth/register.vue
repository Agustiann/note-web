<template>
    <div class="login-wrapper">
        <div class="login-card">

            <div class="logo">
                <img src="/assets/images/logo.png" alt="Todo App">
            </div>
            <h2>Buat Akun Baru</h2>
            <p class="subtitle">
                Isi data di bawah untuk mendaftar
            </p>
            <div v-if="errorMessage" class="alert-error">
                {{ errorMessage }}
            </div>
            <form @submit.prevent="register">
                <div class="form-group">
                    <label>Nama Lengkap</label>
                    <input v-model="form.name" type="text" placeholder="Masukkan nama lengkap">
                </div>

                <div class="form-group">
                    <label>Email</label>
                    <input v-model="form.email" type="text" placeholder="Masukkan email">
                </div>

                <div class="form-group">
                    <label>Password</label>
                    <div class="password-input">
                        <input v-model="form.password" :type="showPassword ? 'text' : 'password'"
                            placeholder="Masukkan password">
                        <button type="button" class="toggle-password" @click="showPassword = !showPassword">
                            <Eye v-if="!showPassword" :size="20" />
                            <EyeClosed v-else :size="20" />
                        </button>
                    </div>
                </div>

                <div class="form-group">
                    <label>Konfirmasi Password</label>
                    <div class="password-input">
                        <input v-model="form.confirmPassword" :type="showConfirmPassword ? 'text' : 'password'"
                            placeholder="Ulangi password">
                        <button type="button" class="toggle-password"
                            @click="showConfirmPassword = !showConfirmPassword">
                            <Eye v-if="!showConfirmPassword" :size="20" />
                            <EyeClosed v-else :size="20" />
                        </button>
                    </div>
                </div>

                <button type="submit" class="btn-login" :disabled="isSubmitting">
                    {{ isSubmitting ? 'Memproses...' : 'Daftar' }}
                </button>

                <p class="switch-auth">
                    Sudah punya akun?
                    <NuxtLink to="/auth/login">Masuk di sini</NuxtLink>
                </p>
            </form>
        </div>
    </div>
</template>

<script setup>
import '~/assets/css/login.scss'
import { Eye, EyeClosed } from 'lucide-vue-next'

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isSubmitting = ref(false)

const errorMessage = ref('')

const form = ref({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
})

function register() {
    if (
        !form.value.name ||
        !form.value.email ||
        !form.value.password ||
        !form.value.confirmPassword
    ) {
        errorMessage.value = 'Semua field wajib diisi.'
        return
    }

    if (form.value.password !== form.value.confirmPassword) {
        errorMessage.value = 'Password dan konfirmasi password tidak sama.'
        return
    }

    if (form.value.password.length < 6) {
        errorMessage.value = 'Password minimal 6 karakter.'
        return
    }

    errorMessage.value = ''
    isSubmitting.value = true

    setTimeout(() => {
        isSubmitting.value = false
        navigateTo('/')
    }, 500)
}
</script>