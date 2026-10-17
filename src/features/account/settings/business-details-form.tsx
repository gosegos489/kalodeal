'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { createWorkspaceCopy } from '@/i18n/workspace-copy'
import { WorkspaceFieldError as FieldError } from '@/shared/ui/workspace-field-error'
import { saveBusinessDetails } from './actions'
import { type BusinessDetails, businessDetailsSchema } from './business-schema'

const fields = [
  { name: 'description', label: 'Business description', max: 2000, multiline: true, help: 'Plain text only. Describe your business and services.' },
  {
    name: 'address',
    label: 'Public business address',
    max: 300,
    multiline: false,
    help: 'Optional. This address will be public; do not enter a private home address.'
  },
  { name: 'website', label: 'Website URL', max: 500, multiline: false, help: 'Optional. Use a full HTTP or HTTPS URL.' },
  { name: 'openingHours', label: 'Opening hours', max: 500, multiline: true, help: 'Optional. For example: Mon–Fri 09:00–18:00, Sat 10:00–14:00.' }
] as const

export function BusinessDetailsForm({ values, pending, feedback }: { values: BusinessDetails; pending: boolean; feedback: string | null }) {
  const t = useTranslations('Workspace')
  const copy = createWorkspaceCopy(t)

  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const form = useForm<BusinessDetails>({ resolver: zodResolver(businessDetailsSchema), values })
  return (
    <form
      className="space-y-5"
      onSubmit={form.handleSubmit(async (data) => {
        setError(null)
        try {
          const result = await saveBusinessDetails(data)
          if (!result.success) setError(copy(result.message, true))
          toast.add({
            title: result.success ? t('businessProfileSaved') : t('couldNotSaveBusinessProfile'),
            description: copy(result.message, true),
            type: result.success ? 'success' : 'error'
          })
          if (result.success) router.refresh()
        } catch {
          setError(t('couldNotSaveBusinessDetailsPleaseTryAgain'))
        }
      })}
    >
      {fields.map(({ name, label, max, multiline, help }) => (
        <Controller
          key={name}
          name={name}
          control={form.control}
          render={({ field, fieldState }) => {
            const props = {
              ...field,
              id: `business-${name}`,
              maxLength: max,
              disabled: form.formState.isSubmitting,
              'aria-invalid': fieldState.invalid,
              'aria-describedby': `business-${name}-help`
            }
            return (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={props.id}>{copy(label)}</FieldLabel>
                {multiline ? (
                  <Textarea {...props} rows={name === 'description' ? 5 : 3} />
                ) : (
                  <Input {...props} type={name === 'website' ? 'url' : 'text'} />
                )}
                <FieldDescription id={`business-${name}-help`}>{copy(help)}</FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )
          }}
        />
      ))}
      {pending && (
        <p role="status" className="text-muted-foreground text-sm">
          {t('awaitingModerationOnlyPreviouslyApprovedDetailsArePublicClearingAFieldRemovesItImmedi')}
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
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? t('savingPending') : t('saveBusinessProfile')}
      </Button>
    </form>
  )
}
