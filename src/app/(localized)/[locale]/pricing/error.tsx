'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

export default function PricingError({ reset }: { reset: () => void }) {
  const t = useTranslations('PricingError')
  return (
    <div role="alert" className="container space-y-4 py-12 text-center">
      <h1 className="text-2xl font-semibold">{t('heading')}</h1>
      <p className="text-muted-foreground">{t('description')}</p>
      <Button onClick={reset}>{t('retry')}</Button>
    </div>
  )
}
