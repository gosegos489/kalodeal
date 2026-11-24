'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Flag } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Controller, useForm } from 'react-hook-form'
import type { z } from 'zod'
import { useId, useState } from 'react'
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { reportConversationUser } from '@/features/moderation/chat-reports/chat-report-actions'
import { createWorkspaceCopy } from '@/i18n/workspace-copy'
import { WorkspaceFieldError as FieldError } from '@/shared/ui/workspace-field-error'
import { createChatReportSchema, reportReasons } from './report-schema'

const formSchema = createChatReportSchema.omit({ conversationId: true })

export function ReportUserButton({ conversationId, otherName }: { conversationId: string; otherName: string }) {
  const t = useTranslations('Workspace')
  const copy = createWorkspaceCopy(t)

  const id = useId()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const form = useForm<z.infer<typeof formSchema>>({ resolver: zodResolver(formSchema), defaultValues: { reason: 'HARASSMENT', details: '' } })
  const busy = form.formState.isSubmitting
  const submit = form.handleSubmit(async (input) => {
    setError(null)
    try {
      const result = await reportConversationUser({ conversationId, ...input })
      if (!result.success) {
        setError(copy(result.message, true))
        return
      }
      toast.add({ type: 'success', title: t('reportReceived'), description: copy(result.message, true) })
      setOpen(false)
      form.reset()
    } catch {
      setError(t('couldNotSubmitYourReportPleaseTryAgain'))
    }
  })

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setError(null)
          setOpen(true)
        }}
      >
        <Flag aria-hidden="true" />
        {t('reportUser')}
      </Button>
      <AlertDialog
        open={open}
        onOpenChange={(value) => {
          if (!busy) setOpen(value)
        }}
      >
        <AlertDialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('report')} {otherName}
            </AlertDialogTitle>
            <AlertDialogDescription>{t('aModeratorCanReviewThisConversationToInvestigateYourReport')}</AlertDialogDescription>
          </AlertDialogHeader>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <Controller
              name="reason"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel id={`${id}-reason`}>{t('reason')}</FieldLabel>
                  <Select
                    items={reportReasons.map((reason) => ({ ...reason, label: copy(reason.label) }))}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={busy}
                  >
                    <SelectTrigger className="w-full" aria-labelledby={`${id}-reason`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reportReasons.map((reason) => (
                        <SelectItem key={reason.value} value={reason.value}>
                          {copy(reason.label)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="details"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${id}-details`}>{t('detailsOptional')}</FieldLabel>
                  <Textarea {...field} id={`${id}-details`} rows={3} maxLength={500} disabled={busy} aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            {error && (
              <p role="alert" className="text-destructive text-sm">
                {error}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={busy} aria-busy={busy}>
                {busy ? t('submitting') : t('submitReport')}
              </Button>
            </div>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
