'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

export default function SellerError({ reset }: { reset: () => void }) {
  const t = useTranslations('Sellers')
  return (
    <div className="container max-w-7xl space-y-4 py-10">
      <h1 className="text-2xl font-semibold">{t('error')}</h1>
      <p className="text-muted-foreground">{t('retry')}</p>
      <Button onClick={reset}>{t('tryAgain')}</Button>
    </div>
  )
}
