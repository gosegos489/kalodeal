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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/toast'
import { localizeHref } from '@/i18n/routing'
import { register } from '../actions/register'
import { getPricingReturnTo } from '../login-redirect'
import { registerSchema } from '../schemas/register'
import type { RegisterInput } from '../types/auth'
import { AuthValidationError } from './auth-validation-error'

export default function RegisterForm() {
  const t = useTranslations('Auth')
  const locale = useLocale()
  const router = useRouter()
  const returnTo = getPricingReturnTo(useSearchParams().get('returnTo'))
  const registerForm = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { accountType: 'PERSONAL', name: '', email: '', password: '', confirm_password: '' }
  })
  const isSubmitting = registerForm.formState.isSubmitting
  const onSubmit = registerForm.handleSubmit(async (data) => {
    try {
      const { error } = await register(data, returnTo ?? undefined, locale)

      if (error) {
        const message =
          error.status === 429
            ? t('feedback.tooManyAttempts')
            : error.code === 'USER_ALREADY_EXISTS' || error.code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL'
              ? t('feedback.alreadyExists')
              : t('feedback.registrationFailed')

        toast.add({ title: t('feedback.registrationFailed'), description: message, type: 'error' })
        return
      }

      registerForm.reset()
      toast.add({ title: t('feedback.checkEmail'), description: t('feedback.verifyEmail'), type: 'success' })
      router.push(returnTo ?? localizeHref('/', locale))
    } catch {
      toast.add({ title: t('feedback.registrationFailed'), description: t('feedback.retry'), type: 'error' })
    }
  })

  const [password, setShowpassword] = useState(false)
  const [confirmPassword, setShowConfirmPassword] = useState(false)

  const handleTogglePassword = () => {
    setShowpassword((prev) => !prev)
  }

  const handleToggleConfirmPassword = () => {
    setShowConfirmPassword((prev) => !prev)
  }

  return (
    <form className="flex flex-col items-center justify-center gap-6" onSubmit={onSubmit}>
      <Controller
        name="accountType"
        control={registerForm.control}
        render={({ field }) => (
          <Tabs
            className="w-full"
            value={field.value}
            onValueChange={(value) => {
              if (value === 'PERSONAL' || value === 'BUSINESS') field.onChange(value)
            }}
          >
            <TabsList className="h-auto w-full" aria-label={t('common.accountType')}>
              <TabsTrigger value="PERSONAL" disabled={isSubmitting} className="min-h-10 whitespace-normal">
                {t('common.personalAccount')}
              </TabsTrigger>
              <TabsTrigger value="BUSINESS" disabled={isSubmitting} className="min-h-10 whitespace-normal">
                {t('common.businessAccount')}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="PERSONAL" className="text-muted-foreground pt-2">
              {t('common.personalDescription')}
            </TabsContent>
            <TabsContent value="BUSINESS" className="text-muted-foreground pt-2">
              {t('common.businessDescription')}
            </TabsContent>
          </Tabs>
        )}
      />
      <FieldGroup>
        <Controller
          name="name"
          control={registerForm.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>{t('common.name')}</FieldLabel>

              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder={t('common.namePlaceholder')}
                autoComplete="name"
                disabled={isSubmitting}
                type="text"
              />

              {fieldState.invalid && <AuthValidationError error={fieldState.error} />}
            </Field>
          )}
        />

        <Controller
          name="email"
          control={registerForm.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>{t('common.email')}</FieldLabel>

              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder={t('common.emailPlaceholder')}
                autoComplete="name"
                type="email"
                disabled={isSubmitting}
              />

              {fieldState.invalid && <AuthValidationError error={fieldState.error} />}
            </Field>
          )}
        />

        <Controller
          name="password"
          control={registerForm.control}
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
          control={registerForm.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>{t('common.confirmPassword')}</FieldLabel>

              <div className="relative">
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder={t('common.confirmPlaceholder')}
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
        {isSubmitting ? t('common.signingUp') : t('common.signUp')}
      </Button>
    </form>
  )
}
