'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { login } from '../actions/login'
import { getLoginErrorKey } from '../login-error'
import { loginSchema } from '../schemas/login'
import type { LoginInput } from '../types/auth'
import { AuthValidationError } from './auth-validation-error'

export default function LoginForm() {
  const t = useTranslations('Auth')
  const locale = useLocale()
  const returnTo = useSearchParams().get('returnTo')
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  })
  const isSubmitting = form.formState.isSubmitting
  const onSubmit = form.handleSubmit(async (data) => {
    try {
      const { error } = await login(data, returnTo ?? undefined, locale)
      if (error) toast.add({ title: t('feedback.loginFailed'), description: t(`feedback.${getLoginErrorKey(error)}`), type: 'error' })
    } catch {
      toast.add({ title: t('feedback.loginFailed'), description: t('feedback.retry'), type: 'error' })
    }
  })

  const [password, setPassword] = useState(false)

  const handleTogglePassword = () => {
    setPassword((prev) => !prev)
  }

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
                  autoComplete="current-password"
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
      </FieldGroup>

      <Button className="w-full max-w-50 cursor-pointer" type="submit" disabled={isSubmitting}>
        {isSubmitting ? t('common.signingIn') : t('common.signIn')}
      </Button>
    </form>
  )
}
