<template>
    <h2>Welcome Back</h2>

    <p class="subtitle">
        Please sign in to your account
    </p>

    <div v-if="errorMessage" class="alert-error">
        {{ errorMessage }}
    </div>

    <form novalidate @submit.prevent="onSubmit">
        <div class="form-group" :class="{ error: errors.email }">
            <label>Email</label>
            <input v-model="email" type="email" placeholder="Masukkan email">
            <span class="error-text" :class="{ 'is-visible': errors.email }">{{ errors.email }}</span>
        </div>

        <div class="form-group" :class="{ error: errors.password }">
            <label>Password</label>
            <div class="password-input">
                <input v-model="password" :type="showPassword ? 'text' : 'password'"
                    placeholder="Masukkan Password">
                <button type="button" class="toggle-password" @click="showPassword = !showPassword">
                    <Eye v-if="!showPassword" :size="20" />
                    <EyeClosed v-else :size="20" />
                </button>
            </div>
            <span class="error-text" :class="{ 'is-visible': errors.password }">{{ errors.password }}</span>
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
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'

const { login: loginRequest } = useAuth()
const { errorMessage, handleApiError } = useApiError()

const showPassword = ref(false)

const { defineField, handleSubmit, errors, isSubmitting } = useForm({
    validationSchema: toTypedSchema(loginSchema),
    initialValues: { email: '', password: '' },
})

const [email] = defineField('email')
const [password] = defineField('password')

const onSubmit = handleSubmit(async (values) => {
    errorMessage.value = ''

    try {
        await loginRequest(values.email, values.password)
        await navigateTo('/dashboard')
    } catch (error) {
        handleApiError(error)
    }
})
</script>