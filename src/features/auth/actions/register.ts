import { authClient } from '@/lib/auth-client'
import type { RegisterInput } from '../types/auth'

export function register({ name, email, password, accountType }: RegisterInput) {
  return authClient.signUp.email({
    accountType,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    callbackURL: '/'
  })
}
