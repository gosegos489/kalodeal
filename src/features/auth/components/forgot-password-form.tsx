'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { requestPasswordReset } from '../actions/forgot-password'
import { forgotPasswordSchema } from '../schemas/forgot-password'
import type { ForgotPasswordInput } from '../types/auth'
import { toast } from '@/components/ui/toast'

export default function ForgotPasswordForm() {
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' }
  })
  const isSubmitting = form.formState.isSubmitting
  const onSubmit = form.handleSubmit(async (data) => {
    const { error } = await requestPasswordReset(data)

    if (error) {
      toast.add({
        title: 'Unable to send reset link',
        description: error.status === 429 ? 'Too many attempts. Please try again later.' : 'Something went wrong',
        type: 'error'
      })
      return
    }

    form.reset()
    toast.add({
      title: 'Check your email',
      description: 'If an account exists with this email, we sent a password reset link.',
      type: 'success'
    })
  })

  return (
    <form className="flex flex-col items-center justify-center gap-6" onSubmit={onSubmit}>
      <FieldGroup>
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Email</FieldLabel>
              <Input {...field} id={field.name} type="email" aria-invalid={fieldState.invalid} placeholder="Enter your email" autoComplete="email" />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <Button className="w-full max-w-50 cursor-pointer" type="submit" disabled={isSubmitting}>
        Reset password
      </Button>
    </form>
  )
}
