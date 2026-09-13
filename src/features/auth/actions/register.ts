import { authClient } from '@/lib/auth-client'
import type { RegisterInput } from '../types/auth'

export function register({ name, email, password }: RegisterInput) {
  return authClient.signUp.email({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    callbackURL: '/'
  })
}
