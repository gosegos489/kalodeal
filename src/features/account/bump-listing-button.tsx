'use client'

import { ArrowUp, Loader2 } from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { getBumpCooldownRemainingMs } from './bump-cooldown'
import { bumpListing } from './bump-listing'

type BumpListingButtonProps = { listingId: string; title: string; bumpedAt: string | null; initialCooldownRemainingMs: number }

export function BumpListingButton({ listingId, title, bumpedAt, initialCooldownRemainingMs }: BumpListingButtonProps) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [cooldownRemainingMs, setCooldownRemainingMs] = useState(initialCooldownRemainingMs)

  useEffect(() => {
    if (!bumpedAt || initialCooldownRemainingMs <= 0) return
    const lastBump = new Date(bumpedAt)
    const updateCooldown = () => setCooldownRemainingMs(getBumpCooldownRemainingMs(lastBump))
    const interval = setInterval(updateCooldown, 60_000)
    const expiry = setTimeout(() => {
      updateCooldown()
      clearInterval(interval)
    }, getBumpCooldownRemainingMs(lastBump))
    return () => {
      clearInterval(interval)
      clearTimeout(expiry)
    }
  }, [bumpedAt, initialCooldownRemainingMs])

  if (cooldownRemainingMs > 0) {
    const duration =
      cooldownRemainingMs >= 60 * 60 * 1000
        ? `${Math.ceil(cooldownRemainingMs / (60 * 60 * 1000))}h`
        : `${Math.ceil(cooldownRemainingMs / (60 * 1000))}m`
    return (
      <p role="status" className="text-muted-foreground text-xs">
        Available again in {duration}
      </p>
    )
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        aria-label={`Bump listing: ${title}`}
        onClick={() => {
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
            }
          })
        }}
      >
        {pending ? <Loader2 aria-hidden="true" className="motion-safe:animate-spin" /> : <ArrowUp aria-hidden="true" />}
        {pending ? 'Bumping...' : 'Bump listing'}
      </Button>
      {error && (
        <p role="alert" className="text-destructive max-w-xs text-xs">
          {error}
        </p>
      )}
    </div>
  )
}
