import { getLocale, getTranslations } from 'next-intl/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { buildMetadata } from '@/lib/metadata'
import { buyerSteps, features, sellerSteps } from './mocks/mocks'

export async function generateMetadata() {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'HowItWorks' })
  return buildMetadata({ title: t('metadataTitle'), description: t('metadataDescription'), path: '/how-it-works', locale, localized: true })
}

export default async function HowItWorksPage() {
  const t = await getTranslations('HowItWorks')
  return (
    <div className="container flex flex-col gap-10 py-10">
      <section className="flex flex-col items-center gap-4 text-center">
        <Badge variant="secondary">{t('badge')}</Badge>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          {t.rich('heading', { brand: (children) => <span className="text-primary">{children}</span> })}
        </h1>
        <p className="text-muted-foreground max-w-2xl">{t('intro')}</p>
      </section>

      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-2xl font-semibold">{t('sellingHeading')}</h2>
          <p className="text-muted-foreground">{t('sellingIntro')}</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {sellerSteps.map((step, index) => (
            <Card key={step.key} className="relative">
              <CardHeader className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
                    <step.icon className="size-5" />
                  </div>
                  <span className="text-muted-foreground text-sm font-medium">{t('step', { number: index + 1 })}</span>
                </div>
                <CardTitle>
                  <h3>{t(`sellerSteps.${step.key}.title`)}</h3>
                </CardTitle>
                <CardDescription>{t(`sellerSteps.${step.key}.description`)}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-2xl font-semibold">{t('buyingHeading')}</h2>
          <p className="text-muted-foreground">{t('buyingIntro')}</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {buyerSteps.map((step, index) => (
            <Card key={step.key}>
              <CardHeader className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
                    <step.icon className="size-5" />
                  </div>
                  <span className="text-muted-foreground text-sm font-medium">{t('step', { number: index + 1 })}</span>
                </div>
                <CardTitle>
                  <h3>{t(`buyerSteps.${step.key}.title`)}</h3>
                </CardTitle>
                <CardDescription>{t(`buyerSteps.${step.key}.description`)}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-2xl font-semibold">{t('whyHeading')}</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.key} className="bg-muted/50 border-none shadow-none">
              <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
                <div className="bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-full">
                  <feature.icon className="size-6" />
                </div>
                <h3 className="font-semibold">{t(`features.${feature.key}.title`)}</h3>
                <p className="text-muted-foreground text-sm">{t(`features.${feature.key}.description`)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
