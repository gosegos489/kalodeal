'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Ban, LoaderCircle, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Controller, useForm, useWatch } from 'react-hook-form'
import z from 'zod'
import { useId, useState } from 'react'
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import type { ActionMessageResult } from '@/lib/action-result'
import { banUser, unbanUser } from './ban-actions'
import { banDurationSchema, banDurations, banReasonSchema } from './ban-schema'

const formSchema = z
  .object({
    banReason: banReasonSchema,
    duration: banDurationSchema,
    expiresLocal: z.string()
  })
  .superRefine((input, ctx) => {
    if (input.duration === 'custom' && (!input.expiresLocal || !(new Date(input.expiresLocal).getTime() > Date.now()))) {
      ctx.addIssue({ code: 'custom', path: ['expiresLocal'], message: 'Choose a valid future date and time.' })
    }
  })
const durations = [...banDurations, { value: 'custom', label: 'Custom expiry' }, { value: 'permanent', label: 'Permanent' }]

export function UserBanControls({ userId, name, banned }: { userId: string; name: string; banned: boolean }) {
  const router = useRouter()
  const id = useId()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<ActionMessageResult | null>(null)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { banReason: '', duration: 'day', expiresLocal: '' }
  })
  const duration = useWatch({ control: form.control, name: 'duration' })

  async function submit(work: () => Promise<ActionMessageResult>) {
    if (busy) return
    setBusy(true)
    setResult(null)
    try {
      const response = await work()
      setResult(response)
      toast.add({
        type: response.success ? 'success' : 'error',
        title: response.success ? 'Ban updated' : 'Could not update ban',
        description: response.message
      })
      if (response.success) {
        setOpen(false)
        form.reset()
        router.refresh()
      }
    } catch {
      setResult({ success: false, message: 'Could not update the ban. Reload to check the current status before retrying.' })
    } finally {
      setBusy(false)
    }
  }

  const onBan = form.handleSubmit((input) =>
    submit(() =>
      banUser({
        userId,
        banReason: input.banReason,
        duration: input.duration,
        ...(input.duration === 'custom' ? { expiresAt: new Date(input.expiresLocal).toISOString() } : {})
      })
    )
  )
  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant={banned ? 'outline' : 'destructive'}
        disabled={busy}
        aria-busy={busy}
        onClick={() => {
          if (banned) void submit(() => unbanUser({ userId }))
          else {
            setResult(null)
            setOpen(true)
          }
        }}
      >
        {busy ? (
          <LoaderCircle aria-hidden="true" className="motion-safe:animate-spin" />
        ) : banned ? (
          <ShieldCheck aria-hidden="true" />
        ) : (
          <Ban aria-hidden="true" />
        )}
        {busy ? 'Updating…' : banned ? 'Unban' : 'Ban user'}
      </Button>
      {result && !open && (
        <p role={result.success ? 'status' : 'alert'} className="text-sm">
          {result.message}
        </p>
      )}
      <AlertDialog
        open={open}
        onOpenChange={(value) => {
          if (!busy) setOpen(value)
        }}
      >
        <AlertDialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="wrap-anywhere">Ban {name}</AlertDialogTitle>
            <AlertDialogDescription>The user will be unable to sign in and their active sessions will be revoked.</AlertDialogDescription>
          </AlertDialogHeader>
          <form onSubmit={onBan} className="flex min-w-0 flex-col gap-4">
            <Controller
              name="banReason"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${id}-reason`}>Reason</FieldLabel>
                  <Textarea {...field} id={`${id}-reason`} maxLength={500} rows={3} disabled={busy} aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="duration"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel id={`${id}-duration`}>Duration</FieldLabel>
                  <Select value={field.value} items={durations} disabled={busy} onValueChange={field.onChange}>
                    <SelectTrigger aria-labelledby={`${id}-duration`} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {durations.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            {duration === 'custom' && (
              <Controller
                name="expiresLocal"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${id}-expiry`}>Expiry (your local time)</FieldLabel>
                    <Input
                      {...field}
                      id={`${id}-expiry`}
                      type="datetime-local"
                      disabled={busy}
                      aria-invalid={fieldState.invalid}
                      className="min-w-0"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            )}
            {result && (
              <p role="alert" className="text-destructive text-sm">
                {result.message}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={busy}>
                {busy ? 'Banning…' : 'Ban user'}
              </Button>
            </div>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
