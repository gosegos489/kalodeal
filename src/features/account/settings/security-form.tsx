'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import z from 'zod'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { changeAccountPassword } from './actions'
import { passwordChangeSchema } from './schema'

export function SecurityForm({ email, hasPassword }: { email: string; hasPassword: boolean }) {
  const form = useForm<z.infer<typeof passwordChangeSchema>>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: '', password: '', confirm_password: '' }
  })
  const busy = form.formState.isSubmitting

  return (
    <form
      className="flex min-w-0 flex-1 flex-col gap-6"
      onSubmit={form.handleSubmit(async (data) => {
        try {
          const changed = await changeAccountPassword(data)
          toast.add({
            title: changed.success ? 'Password changed successfully' : 'Could not change your password',
            description: changed.message,
            type: changed.success ? 'success' : 'error'
          })
          if (changed.success) form.reset()
        } catch {
          toast.add({ title: 'Could not change your password', description: 'Please try again.', type: 'error' })
        }
      })}
    >
      <FieldGroup className="gap-6">
        <Field>
          <FieldLabel htmlFor="account-email">Email</FieldLabel>
          <Input id="account-email" type="email" value={email} readOnly autoComplete="email" />
        </Field>
        {hasPassword ? (
          (['currentPassword', 'password', 'confirm_password'] as const).map((name) => (
            <Controller
              key={name}
              name={name}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`security-${name}`}>
                    {name === 'currentPassword' ? 'Current password' : name === 'password' ? 'New password' : 'Confirm new password'}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={`security-${name}`}
                    type="password"
                    autoComplete={name === 'currentPassword' ? 'current-password' : 'new-password'}
                    disabled={busy}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          ))
        ) : (
          <p className="text-muted-foreground text-sm">This account uses an external sign-in provider. Manage its password with that provider.</p>
        )}
      </FieldGroup>
      {hasPassword && (
        <div className="mt-auto border-t pt-5">
          <Button type="submit" disabled={busy} className="w-full sm:w-auto">
            {busy && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}Change password
          </Button>
        </div>
      )}
    </form>
  )
}
