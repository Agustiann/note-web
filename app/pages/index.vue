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
                    <input v-model="form.email" type="text" placeholder="Masukkan email">
                </div>

                <div class="form-group">
                    <label>Password</label>
                    <div class="password-input">
                        <input v-model="form.password" :type="showPassword ? 'text' : 'password'"
                            placeholder="Masukkan Password">
                        <button type="button" class="toggle-password" @click="showPassword = !showPassword">
                            <Eye v-if="!showPassword" :size="20" />
                            <EyeClosed v-else :size="20" />
                        </button>
                    </div>
                </div>

                <button type="submit" class="btn-login">
                    Login
                </button>

            </form>

        </div>
    </div>
</template>

<script setup>
import '~/assets/css/login.scss'
import { Eye, EyeClosed } from 'lucide-vue-next'

const showPassword = ref(false)

const errorMessage = ref('')

const form = ref({
    email: '',
    password: ''
})

function login() {

    if (
        !form.value.email ||
        !form.value.password
    ) {
        errorMessage.value = 'Semua field wajib diisi.'
        return
    }

    errorMessage.value = ''

    navigateTo('/dashboard')
}
</script>