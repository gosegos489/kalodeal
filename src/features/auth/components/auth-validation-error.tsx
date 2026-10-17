'use client'

import { useTranslations } from 'next-intl'
import type { FieldError as FormFieldError } from 'react-hook-form'
import { FieldError } from '@/components/ui/field'
import type messages from '@/i18n/messages/en.json'

// Translate presentation only; the shared schemas and all of their checks stay authoritative.
const messageKeys: Record<string, keyof typeof messages.Auth.validation> = {
  'Invalid email address': 'emailInvalid',
  'Email must be at most 64 characters long': 'emailTooLong',
  'Password must be at least 8 characters long': 'passwordTooShort',
  'Password must be at most 32 characters long': 'passwordTooLong',
  'Confirm password must be at least 8 characters long': 'confirmTooShort',
  'Confirm password must be at most 32 characters long': 'confirmTooLong',
  'Passwords do not match': 'passwordMismatch',
  'Use no more than 64 characters.': 'nameTooLong',
  'Use at least 2 characters or leave the name empty.': 'nameTooShort',
  'Use a display name without an email address or control characters.': 'nameInvalid',
  'Use a plain text display name.': 'namePlainText'
}

export function AuthValidationError({ error }: { error?: FormFieldError }) {
  const t = useTranslations('Auth.validation')
  if (!error) return null
  return <FieldError errors={[{ message: t(messageKeys[error.message ?? ''] ?? 'invalidData') }]} />
}
