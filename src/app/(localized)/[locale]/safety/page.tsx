import { Flag, ShieldAlert, Wallet } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { buildMetadata } from '@/lib/metadata'
import { buyerTips, generalTips, sellerTips } from './mocks/mocks'

export async function generateMetadata() {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'Safety' })
  return buildMetadata({
    title: t('metadataTitle'),
    description: t('metadataDescription'),
    path: '/safety',
    locale,
    localized: true
  })
}
export default async function SafetyPage() {
  const t = await getTranslations('Safety')
  return (
    <div className="container flex flex-col gap-10 py-10">
      <section className="flex flex-col items-center gap-4 text-center">
        <Badge variant="secondary">{t('badge')}</Badge>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          {t.rich('heading', { highlight: (children) => <span className="text-primary">{children}</span> })}
        </h1>
        <p className="text-muted-foreground max-w-2xl">{t('intro')}</p>
      </section>

      <section className="flex flex-col gap-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {generalTips.map((tip) => (
            <Card key={tip.key}>
              <CardHeader className="flex flex-col gap-3">
                <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
                  <tip.icon className="size-5" />
                </div>
                <CardTitle>
                  <h2>{t(`generalTips.${tip.key}.title`)}</h2>
                </CardTitle>
                <CardDescription>{t(`generalTips.${tip.key}.description`)}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold">{t('sellerHeading')}</h2>
          <ul className="flex flex-col gap-3">
            {sellerTips.map((tip) => (
              <li key={tip} className="flex items-start gap-3">
                <div className="bg-primary/10 text-primary mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full">
                  <ShieldAlert className="size-3.5" />
                </div>
                <span className="text-muted-foreground text-sm">{t(`sellerTips.${tip}`)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold">{t('buyerHeading')}</h2>
          <ul className="flex flex-col gap-3">
            {buyerTips.map((tip) => (
              <li key={tip} className="flex items-start gap-3">
                <div className="bg-primary/10 text-primary mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full">
                  <Wallet className="size-3.5" />
                </div>
                <span className="text-muted-foreground text-sm">{t(`buyerTips.${tip}`)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Alert className="flex flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <Flag className="size-4" />
          <AlertTitle>
            <h2>{t('reportHeading')}</h2>
          </AlertTitle>
        </div>
        <AlertDescription>{t('reportDescription')}</AlertDescription>
      </Alert>
    </div>
  )
}
