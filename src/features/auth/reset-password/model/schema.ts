import z from 'zod'

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, {
        message: 'Password must be at least 8 characters long'
      })
      .max(32, {
        message: 'Password must be at most 32 characters long'
      }),
    confirm_password: z
      .string()
      .min(8, {
        message: 'Confirm password must be at least 8 characters long'
      })
      .max(32, {
        message: 'Confirm password must be at most 32 characters long'
      })
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password']
  })

export type ResetPasswordSchemaTypes = z.infer<typeof resetPasswordSchema>
