'use client'

import { Eye, EyeOff } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { login } from '../actions/login'
import { loginSchema } from '../schemas/login'
import type { LoginInput } from '../types/auth'
import { toast } from '@/components/ui/toast'

export default function LoginForm() {
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  })
  const isSubmitting = form.formState.isSubmitting
  const onSubmit = form.handleSubmit(async (data) => {
    const { error } = await login(data)

    if (!error) return

    const message = error.status === 429 ? 'Too many attempts. Please try again later.' : error.status === 403 ? 'Please verify your email address.' : error.message || 'Something went wrong'

    toast.add({ title: 'Login failed', description: message, type: 'error' })
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
              <FieldLabel htmlFor={field.name}>Email</FieldLabel>
              <Input {...field} id={field.name} type="email" aria-invalid={fieldState.invalid} placeholder="Enter your email" autoComplete="email" />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

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
                  autoComplete="current-password"
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
      </FieldGroup>

      <Button className="w-full max-w-50 cursor-pointer" type="submit" disabled={isSubmitting}>
        Login
      </Button>
    </form>
  )
}
