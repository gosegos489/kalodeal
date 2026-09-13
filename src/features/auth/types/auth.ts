import type { z } from 'zod'
import type { forgotPasswordSchema } from '../schemas/forgot-password'
import type { loginSchema } from '../schemas/login'
import type { registerSchema } from '../schemas/register'
import type { resetPasswordSchema } from '../schemas/reset-password'

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
