export function getLoginErrorKey(error: { code?: string; status?: number }) {
  if (error.code === 'BANNED_USER') return 'banned'
  if (error.code === 'EMAIL_NOT_VERIFIED') return 'emailNotVerified'
  if (error.status === 429) return 'tooManyAttempts'
  if (error.code === 'INVALID_EMAIL_OR_PASSWORD') return 'invalidCredentials'
  return 'loginFailed'
}
