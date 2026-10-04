'use client'

import { RotateCcw, TriangleAlert } from 'lucide-react'
import { useEffect } from 'react'
import { captureClientException } from '@/lib/sentry-client'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    captureClientException(error)
  }, [error])
  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
          <div className="bg-destructive/10 text-destructive flex size-14 items-center justify-center rounded-full">
            <TriangleAlert className="size-7" />
          </div>
          <h1 className="text-2xl font-semibold">Kalodeal is unavailable</h1>
          <p className="text-muted-foreground max-w-md">A critical error occurred. Please try refreshing the page.</p>
          <button
            onClick={() => reset()}
            className="bg-primary text-primary-foreground flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium"
          >
            <RotateCcw className="size-4" />
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
