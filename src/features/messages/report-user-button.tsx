'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Flag } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import type { z } from 'zod'
import { useId, useState } from 'react'
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { reportConversationUser } from '@/features/moderation/chat-reports/chat-report-actions'
import { createChatReportSchema, reportReasons } from './report-schema'

const formSchema = createChatReportSchema.omit({ conversationId: true })

export function ReportUserButton({ conversationId, otherName }: { conversationId: string; otherName: string }) {
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
        setError(result.message)
        return
      }
      toast.add({ type: 'success', title: 'Report received', description: result.message })
      setOpen(false)
      form.reset()
    } catch {
      setError('Could not submit your report. Please try again.')
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
        Report user
      </Button>
      <AlertDialog
        open={open}
        onOpenChange={(value) => {
          if (!busy) setOpen(value)
        }}
      >
        <AlertDialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Report {otherName}</AlertDialogTitle>
            <AlertDialogDescription>A moderator can review this conversation to investigate your report.</AlertDialogDescription>
          </AlertDialogHeader>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <Controller
              name="reason"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel id={`${id}-reason`}>Reason</FieldLabel>
                  <Select items={reportReasons} value={field.value} onValueChange={field.onChange} disabled={busy}>
                    <SelectTrigger className="w-full" aria-labelledby={`${id}-reason`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reportReasons.map((reason) => (
                        <SelectItem key={reason.value} value={reason.value}>
                          {reason.label}
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
                  <FieldLabel htmlFor={`${id}-details`}>Details (optional)</FieldLabel>
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
                Cancel
              </Button>
              <Button type="submit" disabled={busy} aria-busy={busy}>
                {busy ? 'Submitting…' : 'Submit report'}
              </Button>
            </div>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
