import { authClient } from '@/lib/auth-client'
import type { LoginInput } from '../types/auth'

export function login({ email, password }: LoginInput) {
  return authClient.signIn.email({
    email: email.trim().toLowerCase(),
    password,
    callbackURL: '/'
  })
}
