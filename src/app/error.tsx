'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RotateCcw, TriangleAlert } from 'lucide-react'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="bg-destructive/10 text-destructive flex size-14 items-center justify-center rounded-full">
        <TriangleAlert className="size-7" />
      </div>
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground max-w-md">An unexpected error occurred. Please try again, or head back to the homepage.</p>
      <Button onClick={() => reset()} className="gap-2">
        <RotateCcw className="size-4" />
        Try again
      </Button>
    </div>
  )
}
