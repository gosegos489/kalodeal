'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { enableBusinessAccount } from './actions'

export function AccountTypeForm({ business }: { business: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  return (
    <div className="space-y-4">
      <p className="font-medium">{business ? 'Business Account' : 'Personal Account'}</p>
      <p className="text-muted-foreground text-sm">
        Your account type is independent of your subscription. A Business Account includes a public business profile on any plan.
      </p>
      {business ? (
        <p className="text-muted-foreground text-sm">
          Switching back to Personal is currently unavailable. Your existing listings and subscription stay in place.
        </p>
      ) : (
        <Button
          disabled={busy}
          type="button"
          onClick={async () => {
            setBusy(true)
            setError(null)
            try {
              const result = await enableBusinessAccount()
              if (!result.success) setError(result.message)
              toast.add({
                title: result.success ? 'Account updated' : 'Could not update account',
                description: result.message,
                type: result.success ? 'success' : 'error'
              })
              if (result.success) router.refresh()
            } catch {
              setError('Could not update your account. Please try again.')
            } finally {
              setBusy(false)
            }
          }}
        >
          {busy ? 'Updating...' : 'Switch to Business Account'}
        </Button>
      )}
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
    </div>
  )
}
