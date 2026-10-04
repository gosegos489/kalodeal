'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { moderateAvatar, moderateName, retryAvatarCleanup } from './actions'
import { moderationMessageSchema } from './schema'

export function ProfileModerationControls({
  userId,
  version,
  kind,
  cleanup = false
}: {
  userId: string
  version: string | null
  kind: 'name' | 'avatar'
  cleanup?: boolean
}) {
  const router = useRouter()
  const messageId = useId()
  const inFlight = useRef(false)
  const [reviewedVersion, setReviewedVersion] = useState(version)
  const [busy, setBusy] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const changed = reviewedVersion !== version

  async function submit(decision: 'approve' | 'reject' | 'request-changes' | 'cleanup') {
    if (inFlight.current || changed) return
    const parsed = decision === 'request-changes' ? moderationMessageSchema.safeParse(message) : null
    if (parsed && !parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }
    inFlight.current = true
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const review = { userId, version: reviewedVersion, decision, ...(parsed?.success ? { message: parsed.data } : {}) }
      const response = await (decision === 'cleanup' ? retryAvatarCleanup(userId) : kind === 'name' ? moderateName(review) : moderateAvatar(review))
      setResult(response)
      if (response.success) {
        setRequesting(false)
        setMessage('')
      }
      router.refresh()
    } catch {
      setResult({ success: false, message: `Could not moderate this ${kind}. Please try again.` })
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  if (changed) {
    return (
      <div className="flex flex-col items-start gap-3" aria-busy={busy}>
        <p role="status" className="text-sm">
          This pending {kind} has changed. Review the latest profile details before making a decision.
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => {
            setReviewedVersion(version)
            setRequesting(false)
            setMessage('')
            setError(null)
            setResult(null)
          }}
        >
          Review latest version
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3" aria-busy={busy}>
      <div className="flex flex-wrap gap-2">
        {version && (
          <>
            <Button type="button" aria-label={`Approve ${kind}`} disabled={busy || cleanup} onClick={() => void submit('approve')}>
              Approve
            </Button>
            <Button type="button" aria-label={`Reject ${kind}`} variant="outline" disabled={busy || cleanup} onClick={() => void submit('reject')}>
              Reject
            </Button>
            <Button
              type="button"
              aria-label={`Request changes to ${kind}`}
              aria-expanded={requesting}
              aria-controls={`${messageId}-form`}
              variant="outline"
              disabled={busy || cleanup}
              onClick={() => setRequesting(true)}
            >
              Request changes
            </Button>
          </>
        )}
        {cleanup && (
          <Button type="button" variant="outline" disabled={busy} onClick={() => void submit('cleanup')}>
            Retry cleanup
          </Button>
        )}
      </div>
      {requesting && version && (
        <form
          id={`${messageId}-form`}
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            void submit('request-changes')
          }}
        >
          <Field data-invalid={!!error}>
            <FieldLabel htmlFor={messageId}>Message to the user</FieldLabel>
            <Textarea
              id={messageId}
              value={message}
              onChange={(event) => {
                setMessage(event.target.value)
                setError(null)
              }}
              maxLength={500}
              required
              disabled={busy || cleanup}
              aria-invalid={!!error}
              aria-describedby={`${messageId}-help${error ? ` ${messageId}-error` : ''}`}
            />
            <FieldDescription id={`${messageId}-help`}>
              Explain what to change in up to 500 characters. This rejects the pending {kind}.
            </FieldDescription>
            {error && <FieldError id={`${messageId}-error`}>{error}</FieldError>}
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy || cleanup}>
              {busy && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}Send request
            </Button>
            <Button type="button" variant="outline" disabled={busy} onClick={() => setRequesting(false)}>
              Cancel
            </Button>
          </div>
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
