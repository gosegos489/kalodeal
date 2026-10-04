'use client'

import { Check, EyeOff, LoaderCircle, MessageSquare, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import type { ListingModerationDecision } from '@/entities/listing/lifecycle'
import type { ListingCategoryOption } from '@/features/create-listing/types'
import type { ListingStatus } from '@/generated/prisma/enums'
import type { ActionMessageResult } from '@/lib/action-result'
import { moderateListing } from './actions'
import { listingModerationReasons, listingModerationSchema } from './schema'

type Reason = (typeof listingModerationReasons)[number]['value']
type Decision = ListingModerationDecision | 'change-category'

export function ListingModerationControls({
  id,
  updatedAt,
  status,
  categoryId,
  categories
}: {
  id: string
  updatedAt: string
  status: ListingStatus
  categoryId: string
  categories: ListingCategoryOption[]
}) {
  const router = useRouter()
  const fieldId = useId()
  const inFlight = useRef(false)
  const [reviewedVersion, setReviewedVersion] = useState(updatedAt)
  const [pendingDecision, setPendingDecision] = useState<Decision | null>(null)
  const [feedbackDecision, setFeedbackDecision] = useState<'request-changes' | 'reject' | 'hide' | null>(null)
  const [message, setMessage] = useState('')
  const [reason, setReason] = useState<Reason | null>(null)
  const [category, setCategory] = useState(categoryId)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ActionMessageResult | null>(null)
  const busy = pendingDecision !== null
  const decided = result?.success === true
  const changed = reviewedVersion !== updatedAt

  async function submit(decision: Decision) {
    if (inFlight.current || decided || changed) return
    const input = {
      id,
      updatedAt: reviewedVersion,
      decision,
      ...(decision === 'change-category' ? { categoryId: category } : decision === 'approve' ? {} : { message, ...(reason ? { reason } : {}) })
    }
    const parsed = listingModerationSchema.safeParse(input)
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }
    inFlight.current = true
    setPendingDecision(decision)
    setError(null)
    setResult(null)
    try {
      const response = await moderateListing(parsed.data)
      setResult(response)
      toast.add({
        title: response.success ? 'Listing review updated' : 'Could not complete review',
        description: response.message,
        type: response.success ? 'success' : 'error'
      })
      router.refresh()
    } catch {
      setResult({ success: false, message: 'Could not confirm this decision. Reload the listing to check its status before retrying.' })
    } finally {
      setPendingDecision(null)
      inFlight.current = false
    }
  }

  if (changed) {
    return (
      <div className="flex flex-col items-start gap-3" aria-busy={busy}>
        <p role="status" className="text-sm">
          This listing has changed. Review the latest details and photos before making a decision.
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => {
            setReviewedVersion(updatedAt)
            setCategory(categoryId)
            setFeedbackDecision(null)
            setMessage('')
            setReason(null)
            setResult(null)
            setError(null)
          }}
        >
          Review latest version
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4" aria-busy={busy}>
      <p className="text-muted-foreground text-sm">
        {status === 'PENDING'
          ? 'Approve this version, request corrections, or reject it permanently.'
          : 'Hide this published listing and explain the reason to its owner.'}
      </p>
      <div className="flex flex-wrap gap-2">
        {status === 'PENDING' ? (
          <>
            <Button
              type="button"
              disabled={busy || decided || category !== categoryId}
              aria-busy={pendingDecision === 'approve'}
              onClick={() => void submit('approve')}
            >
              {pendingDecision === 'approve' ? (
                <LoaderCircle aria-hidden="true" className="motion-safe:animate-spin" />
              ) : (
                <Check aria-hidden="true" />
              )}
              {pendingDecision === 'approve' ? 'Approving...' : 'Approve'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy || decided}
              onClick={() => {
                setFeedbackDecision('request-changes')
                setError(null)
              }}
              aria-expanded={feedbackDecision === 'request-changes'}
              aria-controls={`${fieldId}-feedback`}
            >
              <MessageSquare aria-hidden="true" /> Request changes
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busy || decided}
              onClick={() => {
                setFeedbackDecision('reject')
                setError(null)
              }}
              aria-expanded={feedbackDecision === 'reject'}
              aria-controls={`${fieldId}-feedback`}
            >
              <X aria-hidden="true" /> Reject
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="outline"
            disabled={busy || decided}
            onClick={() => {
              setFeedbackDecision('hide')
              setError(null)
            }}
            aria-expanded={feedbackDecision === 'hide'}
            aria-controls={`${fieldId}-feedback`}
          >
            <EyeOff aria-hidden="true" /> Hide listing
          </Button>
        )}
      </div>
      {feedbackDecision && (
        <form
          id={`${fieldId}-feedback`}
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            void submit(feedbackDecision)
          }}
        >
          <Field>
            <FieldLabel htmlFor={`${fieldId}-reason`}>Reason (optional)</FieldLabel>
            <Select
              value={reason ?? ''}
              items={[{ value: '', label: 'No category selected' }, ...listingModerationReasons]}
              disabled={busy || decided}
              onValueChange={(value) => setReason(listingModerationReasons.find((item) => item.value === value)?.value ?? null)}
            >
              <SelectTrigger id={`${fieldId}-reason`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectItem value="">No category selected</SelectItem>
                {listingModerationReasons.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field data-invalid={!!error}>
            <FieldLabel htmlFor={`${fieldId}-message`}>Message to the owner{feedbackDecision === 'reject' ? ' (optional)' : ''}</FieldLabel>
            <Textarea
              id={`${fieldId}-message`}
              value={message}
              maxLength={500}
              required={feedbackDecision !== 'reject'}
              disabled={busy || decided}
              aria-invalid={!!error}
              aria-describedby={`${fieldId}-help${error ? ` ${fieldId}-error` : ''}`}
              onChange={(event) => {
                setMessage(event.target.value)
                setError(null)
              }}
            />
            <FieldDescription id={`${fieldId}-help`}>
              {feedbackDecision === 'reject'
                ? 'This decision is final. Explain the reason in up to 500 characters.'
                : 'Explain what needs correcting in a short, neutral message, up to 500 characters.'}
            </FieldDescription>
            {error && <FieldError id={`${fieldId}-error`}>{error}</FieldError>}
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant={feedbackDecision === 'reject' ? 'destructive' : 'default'} disabled={busy || decided}>
              {pendingDecision === feedbackDecision && <LoaderCircle aria-hidden="true" className="motion-safe:animate-spin" />}
              {busy
                ? 'Saving...'
                : feedbackDecision === 'request-changes'
                  ? 'Send request'
                  : feedbackDecision === 'hide'
                    ? 'Hide listing'
                    : 'Reject listing'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy || decided}
              onClick={() => {
                setFeedbackDecision(null)
                setError(null)
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
      {status === 'PENDING' && (
        <form
          className="flex flex-col gap-3 border-t pt-4"
          onSubmit={(event) => {
            event.preventDefault()
            void submit('change-category')
          }}
        >
          <Field>
            <FieldLabel htmlFor={`${fieldId}-category`}>Change category</FieldLabel>
            <Select
              value={category}
              items={categories.map((item) => ({ value: item.id, label: item.name }))}
              disabled={busy || decided || !categories.length}
              onValueChange={(value) => {
                if (value) setCategory(value)
              }}
            >
              <SelectTrigger id={`${fieldId}-category`} className="w-full">
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {categories.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>Correct the category, then review and approve the updated version. Saving keeps it awaiting approval.</FieldDescription>
            {category !== categoryId && <p className="text-muted-foreground text-xs">Save the selected category before approving.</p>}
          </Field>
          <Button
            type="submit"
            variant="outline"
            disabled={busy || decided || !categories.some((item) => item.id === category) || category === categoryId}
          >
            {pendingDecision === 'change-category' && <LoaderCircle aria-hidden="true" className="motion-safe:animate-spin" />}
            {pendingDecision === 'change-category' ? 'Saving category...' : 'Save category'}
          </Button>
          {error && !feedbackDecision && (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}
        </form>
      )}
      {result && (
        <p role={result.success ? 'status' : 'alert'} className={result.success ? 'text-sm' : 'text-destructive text-sm'}>
          {result.message}
        </p>
      )}
    </div>
  )
}
