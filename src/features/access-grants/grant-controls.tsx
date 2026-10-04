'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Controller, useForm, useWatch } from 'react-hook-form'
import z from 'zod'
import { type FormEvent, useId, useRef, useState, useTransition } from 'react'
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import type { ActionMessageResult } from '@/lib/action-result'
import { grantBumps, grantPro, previewGrant, revokePro } from './actions'
import { formatGrantDate } from './format'
import { bumpExpirations, grantReasonSchema, proDurations } from './schema'

const formSchema = z
  .object({
    duration: z.enum(['day', 'week', 'month', 'custom', 'never']),
    amount: z.number().int().min(1).max(100),
    reason: grantReasonSchema,
    expiresLocal: z.string()
  })
  .superRefine((data, ctx) => {
    if (data.duration === 'custom' && !Number.isFinite(new Date(data.expiresLocal).getTime())) {
      ctx.addIssue({ code: 'custom', path: ['expiresLocal'], message: 'Choose a valid expiration date and time.' })
    }
  })
type GrantForm = z.infer<typeof formSchema>
type GrantQuote = { values: GrantForm; expiresAt: string | null }

function GrantDialog({ userId, kind, disabled = false }: { userId: string; kind: 'pro' | 'bumps'; disabled?: boolean }) {
  const router = useRouter()
  const id = useId()
  const inFlight = useRef(false)
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quote, setQuote] = useState<GrantQuote | null>(null)
  const form = useForm<GrantForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { duration: kind === 'pro' ? 'month' : 'never', amount: 5, reason: '', expiresLocal: '' }
  })
  const duration = useWatch({ control: form.control, name: 'duration' })
  const options = kind === 'pro' ? proDurations : bumpExpirations
  const title = kind === 'pro' ? 'Grant PRO access' : 'Grant bonus bumps'

  function run(work: () => Promise<void>) {
    if (inFlight.current) return
    inFlight.current = true
    setError(null)
    startTransition(async () => {
      try {
        await work()
      } catch {
        const message = 'Could not update access. Reload to check the current state before retrying.'
        setError(message)
        toast.add({ type: 'error', title: 'Could not update access', description: message })
      } finally {
        inFlight.current = false
      }
    })
  }

  function review(event: FormEvent<HTMLFormElement>) {
    void form.handleSubmit((values) =>
      run(async () => {
        const result = await previewGrant(
          {
            userId,
            duration: values.duration,
            reason: values.reason,
            ...(kind === 'bumps' ? { amount: values.amount } : {}),
            ...(values.duration === 'custom' ? { expiresAt: new Date(values.expiresLocal).toISOString() } : {})
          },
          kind
        )
        if (!result.success) {
          setError(result.message)
          return
        }
        setQuote({ values, expiresAt: result.data.expiresAt })
      })
    )(event)
  }

  function confirm() {
    if (!quote) return
    run(async () => {
      // Preserve the exact server-quoted expiry. The write validates it again.
      const input = {
        userId,
        reason: quote.values.reason,
        duration: quote.expiresAt ? 'custom' : 'never',
        ...(quote.expiresAt ? { expiresAt: quote.expiresAt } : {})
      }
      const result = kind === 'pro' ? await grantPro(input) : await grantBumps({ ...input, amount: quote.values.amount })
      toast.add({
        type: result.success ? 'success' : 'error',
        title: result.success ? result.message : 'Could not grant access',
        description: result.success ? undefined : result.message
      })
      if (!result.success) {
        setError(result.message)
        router.refresh()
        return
      }
      setOpen(false)
      setQuote(null)
      form.reset()
      router.refresh()
    })
  }

  return (
    <>
      <Button
        variant="outline"
        disabled={disabled || pending}
        onClick={() => {
          setError(null)
          setQuote(null)
          setOpen(true)
        }}
      >
        {title}
      </Button>
      <AlertDialog
        open={open}
        onOpenChange={(value) => {
          if (!pending) setOpen(value)
        }}
      >
        <AlertDialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>
              {kind === 'pro'
                ? 'Complimentary access is separate from paid subscriptions.'
                : 'Bonus bumps can be used with any plan and do not grant Pro features.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {quote ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm">
                {kind === 'pro' ? 'Grant PRO access' : `Grant ${quote.values.amount} bonus bumps`}
                {quote.expiresAt ? ` until ${formatGrantDate(quote.expiresAt)}?` : ' without expiration?'}
              </p>
              {quote.values.reason && <p className="text-muted-foreground text-sm wrap-anywhere">Reason: {quote.values.reason}</p>}
              {error && (
                <p role="alert" className="text-destructive text-sm">
                  {error}
                </p>
              )}
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="outline"
                  disabled={pending}
                  onClick={() => {
                    setQuote(null)
                    setError(null)
                  }}
                >
                  Back
                </Button>
                <Button disabled={pending} aria-busy={pending} onClick={confirm}>
                  {pending ? 'Granting…' : 'Confirm grant'}
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={review} className="flex min-w-0 flex-col gap-4">
              {kind === 'bumps' && (
                <Controller
                  name="amount"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={`${id}-amount`}>Amount</FieldLabel>
                      <Input
                        {...field}
                        value={Number.isNaN(field.value) ? '' : field.value}
                        onChange={(event) => field.onChange(event.target.value === '' ? NaN : Number(event.target.value))}
                        id={`${id}-amount`}
                        type="number"
                        min={1}
                        max={100}
                        step={1}
                        disabled={pending}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              )}
              <Controller
                name="duration"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel id={`${id}-duration`}>{kind === 'pro' ? 'Duration' : 'Expiration'}</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange} items={options} disabled={pending}>
                      <SelectTrigger className="w-full" aria-labelledby={`${id}-duration`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((option) => (
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
                      <FieldLabel htmlFor={`${id}-expires`}>Expiration (your local time, within 365 days)</FieldLabel>
                      <Input {...field} id={`${id}-expires`} type="datetime-local" disabled={pending} aria-invalid={fieldState.invalid} />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              )}
              <Controller
                name="reason"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${id}-reason`}>Reason (optional)</FieldLabel>
                    <Textarea {...field} id={`${id}-reason`} maxLength={500} rows={3} disabled={pending} aria-invalid={fieldState.invalid} />
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
                <Button type="button" variant="outline" disabled={pending} onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending} aria-busy={pending}>
                  {pending ? 'Checking…' : 'Review grant'}
                </Button>
              </div>
            </form>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function RevokeDialog({ userId, grantId }: { userId: string; grantId: string }) {
  const router = useRouter()
  const inFlight = useRef(false)
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<ActionMessageResult | null>(null)
  function revoke() {
    if (inFlight.current) return
    inFlight.current = true
    setResult(null)
    startTransition(async () => {
      try {
        const response = await revokePro({ userId, grantId })
        setResult(response)
        toast.add({
          type: response.success ? 'success' : 'error',
          title: response.success ? 'Access revoked' : 'Could not revoke access',
          description: response.message
        })
        if (response.success) setOpen(false)
        router.refresh()
      } catch {
        const message = 'Could not revoke access. Reload to check the current state before retrying.'
        setResult({ success: false, message })
        toast.add({ type: 'error', title: 'Could not revoke access', description: message })
      } finally {
        inFlight.current = false
      }
    })
  }
  return (
    <>
      <Button
        variant="destructive"
        disabled={pending}
        onClick={() => {
          setResult(null)
          setOpen(true)
        }}
      >
        Revoke access
      </Button>
      <AlertDialog
        open={open}
        onOpenChange={(value) => {
          if (!pending) setOpen(value)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke complimentary PRO access?</AlertDialogTitle>
            <AlertDialogDescription>
              This revokes only the manual grant. An active paid Stripe plan remains available and its billing is unaffected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {result && !result.success && (
            <p role="alert" className="text-destructive text-sm">
              {result.message}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" disabled={pending} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={pending} aria-busy={pending} onClick={revoke}>
              {pending ? 'Revoking…' : 'Revoke access'}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function GrantControls({ userId, manualGrantId }: { userId: string; manualGrantId: string | null }) {
  return (
    <div className="flex flex-wrap gap-2">
      <GrantDialog userId={userId} kind="pro" disabled={!!manualGrantId} />
      {manualGrantId && <RevokeDialog userId={userId} grantId={manualGrantId} />}
      <GrantDialog userId={userId} kind="bumps" />
    </div>
  )
}
