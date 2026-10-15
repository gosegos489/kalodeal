'use client'

import { ArrowUp, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useId, useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import type { ListingStatus } from '@/generated/prisma/enums'
import { boostListing } from './boost-listing'

type BoostListingButtonProps = {
  listingId: string
  title: string
  status: ListingStatus
  boostsRemaining: number
  canBoost: boolean
  unavailableReason?: string
}

const unavailableStatusReasons = {
  PENDING: 'Available after approval.',
  CHANGES_REQUESTED: 'Submit your changes and wait for approval before boosting.',
  HIDDEN: 'Unavailable while hidden by moderation.',
  INACTIVE: 'Unhide this listing before boosting it.',
  REJECTED: 'Rejected listings cannot be boosted.',
  SOLD: 'Sold listings cannot be boosted.'
} satisfies Record<Exclude<ListingStatus, 'ACTIVE'>, string>

export function BoostListingButton({ listingId, title, status, boostsRemaining, canBoost, unavailableReason }: BoostListingButtonProps) {
  const router = useRouter()
  const reasonId = useId()
  const inFlight = useRef(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const unavailableStatusReason = status === 'ACTIVE' ? null : unavailableStatusReasons[status]
  const disabled = !canBoost || status !== 'ACTIVE' || boostsRemaining <= 0
  const label = 'Boost Listing'
  const disabledReason =
    unavailableReason ?? unavailableStatusReason ?? (!canBoost || boostsRemaining <= 0 ? 'No plan or bonus boosts remaining.' : null)

  return (
    <div className="flex w-full min-w-0 flex-col items-start gap-1" title={disabledReason ?? undefined}>
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
              const result = await boostListing(listingId)
              if (!result.success) setError(result.message)
              toast.add({
                title: result.success ? 'Listing boosted' : 'Could not boost listing',
                description: result.message,
                type: result.success ? 'success' : 'error'
              })
            } catch {
              const message = 'Could not boost your listing. Please try again.'
              setError(message)
              toast.add({ title: 'Could not boost listing', description: message, type: 'error' })
            } finally {
              // Reload allowances from the server, including stale-plan or exhausted-quota failures.
              router.refresh()
              inFlight.current = false
            }
          })
        }}
      >
        {pending ? <Loader2 aria-hidden="true" className="motion-safe:animate-spin" /> : <ArrowUp aria-hidden="true" />}
        {pending ? 'Boosting...' : label}
      </Button>
      <span id={reasonId} className="text-muted-foreground min-h-8 w-full text-xs leading-4 wrap-anywhere">
        {disabledReason}
      </span>
      {error && (
        <p role="alert" className="text-destructive max-w-xs text-xs">
          {error}
        </p>
      )}
    </div>
  )
}
