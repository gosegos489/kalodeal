'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { resetPassword } from '../actions/reset-password'
import { getAuthHref } from '../login-redirect'
import { resetPasswordSchema } from '../schemas/reset-password'
import type { ResetPasswordInput } from '../types/auth'
import { AuthValidationError } from './auth-validation-error'

type Props = {
  token: string
}

export default function ResetPasswordForm({ token }: Props) {
  const t = useTranslations('Auth')
  const locale = useLocale()
  const returnTo = useSearchParams().get('returnTo')
  const router = useRouter()
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirm_password: '' }
  })
  const isSubmitting = form.formState.isSubmitting
  const onSubmit = form.handleSubmit(async (data) => {
    if (!token) return

    try {
      const { error } = await resetPassword(data, token)
      if (error) {
        const key =
          error.status === 429
            ? 'feedback.tooManyAttempts'
            : error.code === 'INVALID_TOKEN' || error.code === 'TOKEN_EXPIRED'
              ? 'reset.invalidDescription'
              : 'feedback.retry'
        toast.add({ title: t('feedback.resetFailed'), description: t(key), type: 'error' })
        return
      }
      router.push(getAuthHref('/login', locale, returnTo))
      toast.add({ title: t('feedback.resetSuccess'), type: 'success' })
    } catch {
      toast.add({ title: t('feedback.resetFailed'), description: t('feedback.retry'), type: 'error' })
    }
  })

  const [password, setPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState(false)

  const handleTogglePassword = () => {
    setPassword((prev) => !prev)
  }

  const handleToggleConfirmPassword = () => {
    setConfirmPassword((prev) => !prev)
  }

  return (
    <form className="flex flex-col items-center justify-center gap-6" onSubmit={onSubmit}>
      <FieldGroup>
        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>{t('common.password')}</FieldLabel>

              <div className="relative">
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder={t('common.passwordPlaceholder')}
                  autoComplete="new-password"
                  type={password ? 'text' : 'password'}
                  disabled={isSubmitting}
                  className="pr-10"
                />

                <button
                  aria-label={password ? t('common.hidePassword') : t('common.showPassword')}
                  onClick={handleTogglePassword}
                  className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
                  type="button"
                >
                  {password ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                </button>
              </div>

              {fieldState.invalid && <AuthValidationError error={fieldState.error} />}
            </Field>
          )}
        />

        <Controller
          name="confirm_password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>{t('common.confirmPassword')}</FieldLabel>

              <div className="relative">
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder={t('common.passwordPlaceholder')}
                  autoComplete="new-password"
                  type={confirmPassword ? 'text' : 'password'}
                  disabled={isSubmitting}
                  className="pr-10"
                />

                <button
                  aria-label={confirmPassword ? t('common.hideConfirmPassword') : t('common.showConfirmPassword')}
                  onClick={handleToggleConfirmPassword}
                  className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
                  type="button"
                >
                  {confirmPassword ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                </button>
              </div>

              {fieldState.invalid && <AuthValidationError error={fieldState.error} />}
            </Field>
          )}
        />
      </FieldGroup>

      <Button className="w-full max-w-50 cursor-pointer" type="submit" disabled={isSubmitting}>
        {isSubmitting ? t('common.updatingPassword') : t('common.updatePassword')}
      </Button>
    </form>
  )
}
