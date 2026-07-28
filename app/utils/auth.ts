import { z } from 'zod'

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
            .min(1, 'Kolom ini harus diisi!'),
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
            .refine((value) => !value || value.length >= 6, {
                message: 'Password minimal 6 karakter.',
            }),
        confirmPassword: z.string().trim().optional(),
    })
    .refine((data) => !data.password || data.password === data.confirmPassword, {
        message: 'Konfirmasi password tidak sama.',
        path: ['confirmPassword'],
    })