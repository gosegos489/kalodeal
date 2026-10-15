'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/toast'
import { register } from '../actions/register'
import { registerSchema } from '../schemas/register'
import type { RegisterInput } from '../types/auth'

export default function RegisterForm() {
  const router = useRouter()
  const registerForm = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { accountType: 'PERSONAL', name: '', email: '', password: '', confirm_password: '' }
  })
  const isSubmitting = registerForm.formState.isSubmitting
  const onSubmit = registerForm.handleSubmit(async (data) => {
    try {
      const { error } = await register(data)

      if (error) {
        const message =
          error.status === 429
            ? 'Too many attempts. Please try again later.'
            : error.code === 'USER_ALREADY_EXISTS'
              ? 'An account with this email already exists.'
              : error.message || 'Something went wrong'

        toast.add({ title: 'Registration failed', description: message, type: 'error' })
        return
      }

      registerForm.reset()
      toast.add({ title: 'Check your email', description: 'Please check your email to verify your account.', type: 'success' })
      router.push('/')
    } catch {
      toast.add({ title: 'Registration failed', description: 'Please try again.', type: 'error' })
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
            <TabsList className="h-auto w-full" aria-label="Account type">
              <TabsTrigger value="PERSONAL" disabled={isSubmitting} className="min-h-10 whitespace-normal">
                Personal Account
              </TabsTrigger>
              <TabsTrigger value="BUSINESS" disabled={isSubmitting} className="min-h-10 whitespace-normal">
                Business Account
              </TabsTrigger>
            </TabsList>
            <TabsContent value="PERSONAL" className="text-muted-foreground pt-2">
              For individuals selling personal items.
            </TabsContent>
            <TabsContent value="BUSINESS" className="text-muted-foreground pt-2">
              For businesses, shops and professional sellers.
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
              <FieldLabel htmlFor={field.name}>Display name (optional)</FieldLabel>

              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder="Enter your name"
                autoComplete="name"
                disabled={isSubmitting}
                type="text"
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="email"
          control={registerForm.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Email</FieldLabel>

              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder="Enter your email"
                autoComplete="name"
                type="email"
                disabled={isSubmitting}
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="password"
          control={registerForm.control}
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

                <button
                  aria-label={password ? 'Hide password' : 'Show password'}
                  onClick={handleTogglePassword}
                  className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
                  type="button"
                >
                  {password ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                </button>
              </div>

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="confirm_password"
          control={registerForm.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Confirm Password</FieldLabel>

              <div className="relative">
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder="Confirm Password"
                  autoComplete="new-password"
                  type={confirmPassword ? 'text' : 'password'}
                  disabled={isSubmitting}
                  className="pr-10"
                />

                <button
                  aria-label={confirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  onClick={handleToggleConfirmPassword}
                  className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
                  type="button"
                >
                  {confirmPassword ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                </button>
              </div>

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <Button className="w-full max-w-50 cursor-pointer" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Signing up...' : 'Sign up'}
      </Button>
    </form>
  )
}
