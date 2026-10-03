export function getLoginErrorMessage(error: { code?: string; status?: number; message?: string }) {
  if (error.code === 'BANNED_USER') return 'Your account has been suspended. Please contact support.'
  if (error.code === 'EMAIL_NOT_VERIFIED') return 'Please verify your email address.'
  if (error.status === 429) return 'Too many attempts. Please try again later.'
  return error.message || 'Could not sign in. Please try again.'
}
