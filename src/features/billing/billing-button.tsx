'use client'

import { Loader2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import type { PaidPlan } from '@/lib/plan-limits'
import { cn } from '@/lib/utils'
import { manageSubscription, startPlanCheckout } from './actions'

export function BillingButton({
  intent,
  upgradeLabel,
  plan = 'PRO',
  className
}: {
  intent: 'upgrade' | 'manage'
  upgradeLabel?: string
  plan?: PaidPlan
  className?: string
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  return (
    <div className="flex w-full min-w-0 flex-col items-start gap-2">
      <Button
        className={cn('h-auto min-h-11 w-full cursor-pointer px-4 py-3 whitespace-normal', className)}
        disabled={pending}
        variant={intent === 'upgrade' ? 'default' : 'outline'}
        onClick={() => {
          setError(null)
          startTransition(async () => {
            try {
              const result = await (intent === 'upgrade' ? startPlanCheckout(plan) : manageSubscription())
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
        {pending ? 'Opening...' : (upgradeLabel ?? (intent === 'upgrade' ? 'Upgrade plan' : 'Manage subscription'))}
      </Button>
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
    </div>
  )
}
