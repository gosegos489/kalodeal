import z from 'zod'
import { resetPasswordSchema } from '@/features/auth/schemas/reset-password'
import { listingImageSchema } from '@/features/create-listing/schema'

// An empty value explicitly clears the optional name; it is never a public name.
export const displayNameSchema = z
  .string()
  .trim()
  .max(64, 'Use no more than 64 characters.')
  .refine((value) => value === '' || value.length >= 2, 'Use at least 2 characters or leave the name empty.')
  .refine((value) => !/[@\p{Cc}\p{Cf}]/u.test(value), 'Use a display name without an email address or control characters.')

export const profileSchema = z.object({ name: displayNameSchema })
export const avatarFileSchema = listingImageSchema
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.').max(128),
    password: resetPasswordSchema.shape.password,
    confirm_password: resetPasswordSchema.shape.confirm_password
  })
  .refine((value) => value.password === value.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password']
  })

export const avatarModerationSchema = z.object({
  userId: z.string().min(1).max(128),
  version: z.uuid(),
  decision: z.enum(['approve', 'reject'])
})
