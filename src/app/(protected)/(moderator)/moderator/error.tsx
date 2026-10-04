'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { captureClientException } from '@/lib/sentry-client'

export default function ModerationError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    captureClientException(error)
  }, [error])

  return (
    <div role="alert" className="bg-card flex flex-col items-start gap-4 rounded-xl border p-6">
      <h2 className="text-lg font-semibold">Could not load moderation content</h2>
      <p className="text-muted-foreground text-sm">Please try again in a moment.</p>
      <Button variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}
