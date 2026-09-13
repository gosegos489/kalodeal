import z from 'zod'

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(3, {
        message: 'Name must be at least 3 characters long'
      })
      .max(64, {
        message: 'Name must be at most 64 characters long'
      }),
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
