import z from 'zod'

export const forgotPasswordSchema = z.object({
  email: z.email().max(64, {
    message: 'Email must be at most 64 characters long'
  })
})

export type ForgotPasswordSchemaTypes = z.infer<typeof forgotPasswordSchema>
