'use client'

import { Loader2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { manageSubscription, upgradeToPro } from './actions'

export function BillingButton({ intent }: { intent: 'upgrade' | 'manage' }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        disabled={pending}
        variant={intent === 'upgrade' ? 'default' : 'outline'}
        onClick={() => {
          setError(null)
          startTransition(async () => {
            try {
              const result = await (intent === 'upgrade' ? upgradeToPro() : manageSubscription())
              if (result.success) {
                window.location.assign(result.data.url)
                return
              }
              setError(result.message)
              toast.add({ title: 'Billing unavailable', description: result.message, type: 'error' })
            } catch {
              const message = 'Could not open billing. Please try again.'
              setError(message)
              toast.add({ title: 'Billing unavailable', description: message, type: 'error' })
            }
          })
        }}
      >
        {pending && <Loader2 aria-hidden="true" className="motion-safe:animate-spin" />}
        {pending ? 'Opening...' : intent === 'upgrade' ? 'Upgrade to Pro' : 'Manage subscription'}
      </Button>
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
    </div>
  )
}
