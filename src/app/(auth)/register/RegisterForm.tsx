'use client'

import { Eye, EyeOff } from 'lucide-react'
import { Controller } from 'react-hook-form'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useRegister } from './useRegister'

export default function RegisterForm() {
  const { registerForm, isSubmitting, onSubmit } = useRegister()

  const [password, setShowpassword] = useState(false)
  const [confirmPassword, setShowConfirmPassword] = useState(false)

  const handleTogglePassword = () => {
    setShowpassword((prev) => !prev)
  }

  const handleToggleConfirmPassword = () => {
    setShowConfirmPassword((prev) => !prev)
  }

  return (
    <form onSubmit={onSubmit}>
      <FieldGroup>
        <Controller
          name="full_name"
          control={registerForm.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Full name</FieldLabel>

              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder="Enter your full name"
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

                <button onClick={handleToggleConfirmPassword} className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer" type="button">
                  {confirmPassword ? <EyeOff className="size-4" /> : <EyeOff className="size-4" />}
                </button>
              </div>

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <Button type="submit" disabled={isSubmitting}>
        Register
      </Button>
    </form>
  )
}
