'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import type z from 'zod'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { saveBusinessName } from './actions'
import { businessNameSchema } from './schema'

export function BusinessNameForm({
  name,
  pendingName,
  feedback,
  eligible
}: {
  name: string | null
  pendingName: string | null
  feedback: string | null
  eligible: boolean
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const form = useForm<z.infer<typeof businessNameSchema>>({
    resolver: zodResolver(businessNameSchema),
    values: { businessName: pendingName ?? name ?? '' }
  })
  return (
    <form
      className="flex w-full flex-col gap-4"
      onSubmit={form.handleSubmit(async (data) => {
        setError(null)
        try {
          const result = await saveBusinessName(data)
          if (!result.success) setError(result.message)
          toast.add({
            title: result.success ? 'Business name saved' : 'Could not save business name',
            description: result.message,
            type: result.success ? 'success' : 'error'
          })
          router.refresh()
        } catch {
          setError('Could not save business name. Please try again.')
        }
      })}
    >
      <Controller
        name="businessName"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="business-name">Business display name</FieldLabel>
            <Input
              {...field}
              id="business-name"
              maxLength={64}
              disabled={form.formState.isSubmitting}
              aria-invalid={fieldState.invalid}
              aria-describedby="business-name-help"
            />
            <FieldDescription id="business-name-help">
              Reviewed before appearing on listings. Shown only with active Business access; this is not a verified company identity. Leave empty to
              remove.
            </FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      {!eligible && <p className="text-muted-foreground text-sm">Business access is required to submit a name. You can clear a saved name.</p>}
      {pendingName && (
        <p role="status" className="text-muted-foreground text-sm">
          Awaiting moderation. Approved name: {name ?? 'None'}
        </p>
      )}
      {feedback && (
        <p role="status" className="text-muted-foreground text-sm">
          Moderator feedback: {feedback}
        </p>
      )}
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      <Button type="submit" disabled={form.formState.isSubmitting} className="w-fit">
        {form.formState.isSubmitting && <Loader2 aria-hidden="true" className="motion-safe:animate-spin" />}Save business name
      </Button>
    </form>
  )
}
