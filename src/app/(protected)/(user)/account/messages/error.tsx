'use client'

import { Button } from '@/components/ui/button'

export default function MessagesError({ reset }: { reset: () => void }) {
  return (
    <section className="bg-card flex flex-col items-start gap-4 rounded-xl border p-6">
      <h2 className="text-xl font-semibold">Messages are temporarily unavailable</h2>
      <p className="text-muted-foreground text-sm">Could not load your conversations. Please try again.</p>
      <Button onClick={reset}>Try again</Button>
    </section>
  )
}
