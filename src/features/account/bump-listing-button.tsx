'use client'

import { ArrowUp, Loader2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { bumpListing } from './bump-listing'

export function BumpListingButton({ listingId, title, disabled }: { listingId: string; title: string; disabled: boolean }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        variant="outline"
        size="sm"
        disabled={disabled || pending}
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
        {pending ? 'Bumping...' : 'Bump'}
      </Button>
      {error && (
        <p role="alert" className="text-destructive max-w-xs text-xs">
          {error}
        </p>
      )}
    </div>
  )
}
