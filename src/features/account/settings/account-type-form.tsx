'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { createWorkspaceCopy } from '@/i18n/workspace-copy'
import { enableBusinessAccount } from './actions'

export function AccountTypeForm({ business }: { business: boolean }) {
  const t = useTranslations('Workspace')
  const copy = createWorkspaceCopy(t)

  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  return (
    <div className="space-y-4">
      <p className="font-medium">{business ? t('businessAccount') : t('personalAccount')}</p>
      <p className="text-muted-foreground text-sm">{t('yourAccountTypeIsIndependentOfYourSubscriptionABusinessAccountIncludesAPublicBusiness')}</p>
      {business ? (
        <p className="text-muted-foreground text-sm">{t('switchingBackToPersonalIsCurrentlyUnavailableYourExistingListingsAndSubscriptionStayI')}</p>
      ) : (
        <Button
          disabled={busy}
          type="button"
          onClick={async () => {
            setBusy(true)
            setError(null)
            try {
              const result = await enableBusinessAccount()
              if (!result.success) setError(copy(result.message, true))
              toast.add({
                title: result.success ? t('accountUpdated') : t('couldNotUpdateAccount'),
                description: copy(result.message, true),
                type: result.success ? 'success' : 'error'
              })
              if (result.success) router.refresh()
            } catch {
              setError(t('couldNotUpdateYourAccountPleaseTryAgain'))
            } finally {
              setBusy(false)
            }
          }}
        >
          {busy ? t('updating') : t('switchToBusinessAccount')}
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
