'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import type z from 'zod'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { createWorkspaceCopy } from '@/i18n/workspace-copy'
import { WorkspaceFieldError as FieldError } from '@/shared/ui/workspace-field-error'
import { saveBusinessName } from './actions'
import { businessNameSchema } from './schema'

export function BusinessNameForm({ name, pendingName, feedback }: { name: string | null; pendingName: string | null; feedback: string | null }) {
  const t = useTranslations('Workspace')
  const copy = createWorkspaceCopy(t)

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
          if (!result.success) setError(copy(result.message, true))
          toast.add({
            title: result.success ? t('businessNameSaved') : t('couldNotSaveBusinessName'),
            description: copy(result.message, true),
            type: result.success ? 'success' : 'error'
          })
          router.refresh()
        } catch {
          setError(t('couldNotSaveBusinessNamePleaseTryAgain'))
        }
      })}
    >
      <Controller
        name="businessName"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="business-name">{t('businessDisplayName')}</FieldLabel>
            <Input
              {...field}
              id="business-name"
              maxLength={64}
              disabled={form.formState.isSubmitting}
              aria-invalid={fieldState.invalid}
              aria-describedby="business-name-help"
            />
            <FieldDescription id="business-name-help">
              {t('reviewedBeforeBecomingPublicAvailableOnYourSellerPageOnAnyPlanBrandingOnListingsRequi')}
            </FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      {pendingName && (
        <p role="status" className="text-muted-foreground text-sm">
          {t('awaitingModerationApprovedName')} {name ?? t('none')}
        </p>
      )}
      {feedback && (
        <p role="status" className="text-muted-foreground text-sm">
          {t('moderatorFeedback')} {feedback}
        </p>
      )}
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      <Button type="submit" disabled={form.formState.isSubmitting} className="w-fit">
        {form.formState.isSubmitting && <Loader2 aria-hidden="true" className="motion-safe:animate-spin" />}
        {t('saveBusinessName')}
      </Button>
    </form>
  )
}
