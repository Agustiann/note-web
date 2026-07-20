<template>
    <div class="login-wrapper">
        <div class="login-card">

            <div class="logo">
                <img src="/assets/images/logo.png" alt="Todo App">
            </div>

            <h2>Welcome Back</h2>

            <p class="subtitle">
                Please sign in to your account
            </p>

            <div v-if="errorMessage" class="alert-error">
                {{ errorMessage }}
            </div>

            <form @submit.prevent="login">
                <div class="form-group">
                    <label>Email</label>
                    <input v-model="form.email" type="email" placeholder="Masukkan email" required>
                </div>

                <div class="form-group">
                    <label>Password</label>
                    <div class="password-input">
                        <input v-model="form.password" :type="showPassword ? 'text' : 'password'"
                            placeholder="Masukkan Password" required>
                        <button type="button" class="toggle-password" @click="showPassword = !showPassword">
                            <Eye v-if="!showPassword" :size="20" />
                            <EyeClosed v-else :size="20" />
                        </button>
                    </div>
                </div>

                <button type="submit" class="btn-login" :disabled="isSubmitting">
                    <span v-if="isSubmitting" class="spinner"></span>
                    <span v-else>Login</span>
                </button>

                <p class="switch-auth">
                    Belum punya akun?
                    <NuxtLink to="/auth/register">Daftar di sini</NuxtLink>
                </p>

            </form>

        </div>
    </div>
</template>

<script setup>
import '~/assets/css/login.scss'
import { Eye, EyeClosed } from 'lucide-vue-next'

const { login: loginRequest } = useAuth()

const showPassword = ref(false)
const isSubmitting = ref(false)

const errorMessage = ref('')

const form = ref({
    email: '',
    password: ''
})

async function login() {
    errorMessage.value = ''
    isSubmitting.value = true

    try {
        await loginRequest(form.value.email, form.value.password)
        navigateTo('/dashboard')
    } catch (error) {
        const data = error?.data

        if (data?.errors) {
            errorMessage.value = Object.values(data.errors).flat().join(' ')
        } else {
            errorMessage.value = data?.message || 'Terjadi kesalahan, silakan coba lagi.'
        }
    } finally {
        isSubmitting.value = false
    }
}
</script>