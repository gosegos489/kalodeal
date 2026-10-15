'use client'

import { Button } from '@/components/ui/button'

export default function SellerError({ reset }: { reset: () => void }) {
  return (
    <div className="container max-w-7xl space-y-4 py-10">
      <h1 className="text-2xl font-semibold">Could not load this seller</h1>
      <p className="text-muted-foreground">Please try again.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
