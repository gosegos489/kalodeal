'use client'

import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { captureClientException } from '@/lib/sentry-client'

export default function MessagesError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('Workspace')

  useEffect(() => {
    captureClientException(error)
  }, [error])

  return (
    <section className="bg-card flex flex-col items-start gap-4 rounded-xl border p-6">
      <h2 className="text-xl font-semibold">{t('messagesAreTemporarilyUnavailable')}</h2>
      <p className="text-muted-foreground text-sm">{t('couldNotLoadYourConversationsPleaseTryAgain')}</p>
      <Button onClick={reset}>{t('tryAgain')}</Button>
    </section>
  )
}
