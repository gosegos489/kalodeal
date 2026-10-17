'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { requestPasswordReset } from '../actions/forgot-password'
import { forgotPasswordSchema } from '../schemas/forgot-password'
import type { ForgotPasswordInput } from '../types/auth'
import { AuthValidationError } from './auth-validation-error'

export default function ForgotPasswordForm() {
  const t = useTranslations('Auth')
  const locale = useLocale()
  const returnTo = useSearchParams().get('returnTo')
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' }
  })
  const isSubmitting = form.formState.isSubmitting
  const onSubmit = form.handleSubmit(async (data) => {
    try {
      const { error } = await requestPasswordReset(data, locale, returnTo)
      if (error) {
        toast.add({
          title: t('feedback.resetLinkFailed'),
          description: t(error.status === 429 ? 'feedback.tooManyAttempts' : 'feedback.retry'),
          type: 'error'
        })
        return
      }
      form.reset()
      toast.add({ title: t('feedback.checkEmail'), description: t('feedback.resetEmailSent'), type: 'success' })
    } catch {
      toast.add({ title: t('feedback.resetLinkFailed'), description: t('feedback.retry'), type: 'error' })
    }
  })

  return (
    <form className="flex flex-col items-center justify-center gap-6" onSubmit={onSubmit}>
      <FieldGroup>
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>{t('common.email')}</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="email"
                aria-invalid={fieldState.invalid}
                placeholder={t('common.emailPlaceholder')}
                autoComplete="email"
              />
              {fieldState.invalid && <AuthValidationError error={fieldState.error} />}
            </Field>
          )}
        />
      </FieldGroup>

      <Button className="w-full max-w-50 cursor-pointer" type="submit" disabled={isSubmitting}>
        {isSubmitting ? t('common.sending') : t('common.sendResetLink')}
      </Button>
    </form>
  )
}
