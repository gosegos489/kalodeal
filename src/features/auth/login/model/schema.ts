import z from 'zod'

export const loginSchema = z.object({
  email: z.email().max(64, {
    message: 'Email must be at most 64 characters long'
  }),
  password: z
    .string()
    .min(8, {
      message: 'Password must be at least 8 characters long'
    })
    .max(32, {
      message: 'Password must be at most 32 characters long'
    })
})

export type LoginSchemaTypes = z.infer<typeof loginSchema>
