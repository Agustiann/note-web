<template>
    <h2>Welcome Back</h2>

    <p class="subtitle">
        Please sign in to your account
    </p>

    <div v-if="errorMessage" class="alert-error">
        {{ errorMessage }}
    </div>

    <form novalidate @submit.prevent="login">
        <div class="form-group" :class="{ error: fieldErrors.email }">
            <label>Email</label>
            <input v-model="form.email" type="email" placeholder="Masukkan email">
            <span class="error-text" :class="{ 'is-visible': fieldErrors.email }">{{ fieldErrors.email }}</span>
        </div>

        <div class="form-group" :class="{ error: fieldErrors.password }">
            <label>Password</label>
            <div class="password-input">
                <input v-model="form.password" :type="showPassword ? 'text' : 'password'"
                    placeholder="Masukkan Password">
                <button type="button" class="toggle-password" @click="showPassword = !showPassword">
                    <Eye v-if="!showPassword" :size="20" />
                    <EyeClosed v-else :size="20" />
                </button>
            </div>
            <span class="error-text" :class="{ 'is-visible': fieldErrors.password }">{{ fieldErrors.password }}</span>
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
</template>

<script setup>
definePageMeta({ layout: 'auth' })

import { Eye, EyeClosed } from 'lucide-vue-next'

const { login: loginRequest } = useAuth()
const { errorMessage, handleApiError } = useApiError()

const showPassword = ref(false)
const isSubmitting = ref(false)
const fieldErrors = ref({})

const form = reactive({
    email: '',
    password: '',
})

function validate() {
    fieldErrors.value = {}

    const emailError = validateEmail(form.email)
    if (emailError) fieldErrors.value.email = emailError

    if (!form.password) {
        fieldErrors.value.password = 'Kolom ini harus diisi!'
    }

    return Object.keys(fieldErrors.value).length === 0
}

async function login() {
    errorMessage.value = ''

    if (!validate()) return

    isSubmitting.value = true

    try {
        await loginRequest(form.email, form.password)
        await navigateTo('/dashboard')
    } catch (error) {
        handleApiError(error)
    } finally {
        isSubmitting.value = false
    }
}
</script>