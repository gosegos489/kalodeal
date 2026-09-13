'use client'

import { Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { resetPassword } from '../actions/reset-password'
import { resetPasswordSchema } from '../schemas/reset-password'
import type { ResetPasswordInput } from '../types/auth'

type Props = {
  token: string
}

export default function ResetPasswordForm({ token }: Props) {
  const router = useRouter()
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirm_password: '' }
  })
  const isSubmitting = form.formState.isSubmitting
  const onSubmit = form.handleSubmit(async (data) => {
    if (!token) return

    const { error } = await resetPassword(data, token)

    if (error) {
      toast.add({ title: 'Unable to reset password', description: error.message || 'Something went wrong', type: 'error' })
      return
    }

    router.push('/login')
    toast.add({ title: 'Password reset successfully', type: 'success' })
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
              <FieldLabel htmlFor={field.name}>Password</FieldLabel>

              <div className="relative">
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder="Enter your password"
                  autoComplete="new-password"
                  type={password ? 'text' : 'password'}
                  disabled={isSubmitting}
                  className="pr-10"
                />

                <button onClick={handleTogglePassword} className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer" type="button">
                  {password ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                </button>
              </div>

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="confirm_password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Confirm Password</FieldLabel>

              <div className="relative">
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder="Enter your password"
                  autoComplete="new-password"
                  type={confirmPassword ? 'text' : 'password'}
                  disabled={isSubmitting}
                  className="pr-10"
                />

                <button onClick={handleToggleConfirmPassword} className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer" type="button">
                  {confirmPassword ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                </button>
              </div>

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <Button className="w-full max-w-50 cursor-pointer" type="submit" disabled={isSubmitting}>
        Update password
      </Button>
    </form>
  )
}
