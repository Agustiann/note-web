<template>
    <h2>Buat Akun Baru</h2>

    <p class="subtitle">
        Isi data di bawah untuk mendaftar
    </p>

    <div v-if="errorMessage" class="alert-error">
        {{ errorMessage }}
    </div>

    <form novalidate @submit.prevent="onSubmit">
        <div class="form-group" :class="{ error: errors.name }">
            <label>Nama Lengkap</label>
            <input v-model="name" type="text" placeholder="Masukkan nama lengkap">
            <span class="error-text" :class="{ 'is-visible': errors.name }">{{ errors.name }}</span>
        </div>

        <div class="form-group" :class="{ error: errors.email }">
            <label>Email</label>
            <input v-model="email" type="email" placeholder="Masukkan email">
            <span class="error-text" :class="{ 'is-visible': errors.email }">{{ errors.email }}</span>
        </div>

        <div class="form-group" :class="{ error: errors.password }">
            <label>Password</label>
            <div class="password-input">
                <input v-model="password" :type="showPassword ? 'text' : 'password'"
                    placeholder="Masukkan password">
                <button type="button" class="toggle-password" @click="showPassword = !showPassword">
                    <Eye v-if="!showPassword" :size="20" />
                    <EyeClosed v-else :size="20" />
                </button>
            </div>
            <span class="error-text" :class="{ 'is-visible': errors.password }">{{ errors.password }}</span>
        </div>

        <div class="form-group" :class="{ error: errors.confirmPassword }">
            <label>Konfirmasi Password</label>
            <div class="password-input">
                <input v-model="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'"
                    placeholder="Ulangi password">
                <button type="button" class="toggle-password" @click="showConfirmPassword = !showConfirmPassword">
                    <Eye v-if="!showConfirmPassword" :size="20" />
                    <EyeClosed v-else :size="20" />
                </button>
            </div>
            <span class="error-text" :class="{ 'is-visible': errors.confirmPassword }">{{ errors.confirmPassword }}</span>
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
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'

const { register: registerRequest } = useAuth()
const { errorMessage, handleApiError } = useApiError()
const toast = useAppToast()

const showPassword = ref(false)
const showConfirmPassword = ref(false)

const { defineField, handleSubmit, errors, isSubmitting } = useForm({
    validationSchema: toTypedSchema(registerSchema),
    initialValues: { name: '', email: '', password: '', confirmPassword: '' },
})

const [name] = defineField('name')
const [email] = defineField('email')
const [password] = defineField('password')
const [confirmPassword] = defineField('confirmPassword')

const onSubmit = handleSubmit(async (values) => {
    errorMessage.value = ''

    try {
        await registerRequest({
            name: values.name,
            email: values.email,
            password: values.password,
            password_confirmation: values.confirmPassword,
        })

        toast.success('Registrasi berhasil! Silakan login.')
        await navigateTo('/auth/login')
    } catch (error) {
        handleApiError(error)
    }
})
</script>