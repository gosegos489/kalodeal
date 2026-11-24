'use client'

import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { captureClientException } from '@/lib/sentry-client'

export default function OrdersError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('Workspace')

  useEffect(() => {
    captureClientException(error)
  }, [error])

  return (
    <div role="alert" className="bg-card flex flex-col items-start gap-4 rounded-xl border p-6">
      <h2 className="text-lg font-semibold">{t('couldNotLoadYourPayments')}</h2>
      <p className="text-muted-foreground text-sm">{t('pleaseTryAgainInAMoment')}</p>
      <Button variant="outline" onClick={reset}>
        {t('tryAgain')}
      </Button>
    </div>
  )
}
