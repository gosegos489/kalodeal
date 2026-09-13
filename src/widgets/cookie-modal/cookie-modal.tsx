'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { setCookieConsent } from './actions'
import type { CookieConsent } from './constants'

type CookieModalProps = {
  consent?: CookieConsent
}

export function CookieModal({ consent }: CookieModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  if (consent) {
    return null
  }

  function saveConsent(nextConsent: CookieConsent) {
    startTransition(async () => {
      await setCookieConsent(nextConsent)
      router.refresh()
    })
  }

  return (
    <div className="bg-background fixed right-4 bottom-4 left-4 z-50 mx-auto max-w-xl rounded-lg border p-4 shadow-lg sm:left-auto sm:mx-0">
      <div className="space-y-3">
        <div>
          <p className="text-base font-semibold">Cookie preferences</p>
          <p className="text-muted-foreground mt-1 text-sm">
            We use optional analytics cookies to understand product usage. If you decline, Google Analytics will not be loaded.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" disabled={isPending} onClick={() => saveConsent('rejected')}>
            Decline
          </Button>
          <Button disabled={isPending} onClick={() => saveConsent('accepted')}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  )
}
