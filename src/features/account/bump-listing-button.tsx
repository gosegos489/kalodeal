'use client'

import { ArrowUp, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useId, useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import type { ListingStatus } from '@/generated/prisma/enums'
import { bumpListing } from './bump-listing'

type BumpListingButtonProps = { listingId: string; title: string; status: ListingStatus; bumpsRemaining: number; canBump: boolean }

const unavailableStatusReasons = {
  PENDING: 'Awaiting approval.',
  HIDDEN: 'Hidden listings cannot be bumped.',
  INACTIVE: 'Inactive listings cannot be bumped.',
  REJECTED: 'Rejected listings cannot be bumped.',
  SOLD: 'Sold listings cannot be bumped.'
} satisfies Record<Exclude<ListingStatus, 'ACTIVE'>, string>

export function BumpListingButton({ listingId, title, status, bumpsRemaining, canBump }: BumpListingButtonProps) {
  const router = useRouter()
  const reasonId = useId()
  const inFlight = useRef(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const unavailableStatusReason = status === 'ACTIVE' ? null : unavailableStatusReasons[status]
  const disabled = !canBump || status !== 'ACTIVE' || bumpsRemaining <= 0
  const label = !canBump ? 'Bump (Pro)' : status === 'ACTIVE' && bumpsRemaining <= 0 ? 'No bumps remaining' : 'Bump'
  const disabledReason =
    unavailableStatusReason ??
    (!canBump ? 'An active Pro plan is required.' : bumpsRemaining <= 0 ? 'Your bumps for this period have been used.' : null)

  return (
    <div className="flex max-w-full flex-col items-start gap-1" title={disabledReason ?? undefined}>
      <Button
        variant="outline"
        size="sm"
        disabled={pending || disabled}
        aria-busy={pending}
        aria-label={`${label}: ${title}`}
        aria-describedby={disabledReason ? reasonId : undefined}
        onClick={() => {
          if (pending || inFlight.current || disabled) return
          inFlight.current = true
          setError(null)
          startTransition(async () => {
            try {
              const result = await bumpListing(listingId)
              if (!result.success) setError(result.message)
              toast.add({
                title: result.success ? 'Listing bumped' : 'Could not bump listing',
                description: result.message,
                type: result.success ? 'success' : 'error'
              })
            } catch {
              const message = 'Could not bump your listing. Please try again.'
              setError(message)
              toast.add({ title: 'Could not bump listing', description: message, type: 'error' })
            } finally {
              // Reload allowances from the server, including stale-plan or exhausted-quota failures.
              router.refresh()
              inFlight.current = false
            }
          })
        }}
      >
        {pending ? <Loader2 aria-hidden="true" className="motion-safe:animate-spin" /> : <ArrowUp aria-hidden="true" />}
        {pending ? 'Bumping...' : label}
      </Button>
      {disabledReason && (
        <span id={reasonId} className="sr-only">
          {disabledReason}
        </span>
      )}
      {error && (
        <p role="alert" className="text-destructive max-w-xs text-xs">
          {error}
        </p>
      )}
    </div>
  )
}
