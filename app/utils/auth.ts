import { z } from 'zod'

export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
export const passwordRegexMessage = 'Password minimal 8 karakter dan harus mengandung huruf besar, huruf kecil, angka, serta simbol.'

export const loginSchema = z.object({
    email: z
        .string({ required_error: 'Kolom ini harus diisi!' })
        .trim()
        .min(1, 'Kolom ini harus diisi!')
        .email('Format email tidak valid.'),
    password: z
        .string({ required_error: 'Kolom ini harus diisi!' })
        .min(1, 'Kolom ini harus diisi!'),
})

export const registerSchema = z
    .object({
        name: z
            .string({ required_error: 'Kolom ini harus diisi!' })
            .trim()
            .min(1, 'Kolom ini harus diisi!'),
        email: z
            .string({ required_error: 'Kolom ini harus diisi!' })
            .trim()
            .min(1, 'Kolom ini harus diisi!')
            .email('Format email tidak valid.'),
        password: z
            .string({ required_error: 'Kolom ini harus diisi!' })
            .min(1, 'Kolom ini harus diisi!')
            .regex(passwordRegex, passwordRegexMessage),
        confirmPassword: z
            .string({ required_error: 'Kolom ini harus diisi!' })
            .min(1, 'Kolom ini harus diisi!'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Konfirmasi password tidak sama.',
        path: ['confirmPassword'],
    })

export const updateProfileSchema = z
    .object({
        name: z
            .string({ required_error: 'Nama wajib diisi.' })
            .trim()
            .min(1, 'Nama wajib diisi.')
            .max(50, 'Nama maksimal 50 karakter.'),
        password: z
            .string()
            .trim()
            .optional()
            .refine((value) => !value || passwordRegex.test(value), {
                message: passwordRegexMessage,
            }),
        confirmPassword: z.string().trim().optional(),
    })
    .refine((data) => !data.password || data.password === data.confirmPassword, {
        message: 'Konfirmasi password tidak sama.',
        path: ['confirmPassword'],
    })