import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import { ContactUsForm } from '@/features/contact-us'
import { ClientMessages } from '@/i18n/client-messages'
import { buildMetadata } from '@/lib/metadata'

export async function generateMetadata() {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'ContactUs' })
  return buildMetadata({ title: t('metadataTitle'), description: t('metadataDescription'), path: '/contact-us', locale, localized: true })
}

export default async function ContactUsPage() {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'ContactUs' })
  const messages = await getMessages({ locale })
  return (
    <section className="container flex items-center py-12 lg:py-20">
      <div className="grid w-full gap-12 lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col gap-8">
          <div className="flex max-w-xl flex-col gap-4">
            <p className="text-primary text-sm font-semibold tracking-wide uppercase">{t('badge')}</p>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">{t('heading')}</h1>

            <p className="text-muted-foreground text-lg leading-8">{t('intro')}</p>
          </div>
        </div>

        <div className="bg-card mx-auto flex w-full flex-col gap-6 rounded-xl border p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold">{t('formHeading')}</h2>

            <p className="text-muted-foreground text-sm">{t('formIntro')}</p>
          </div>

          <ClientMessages locale={locale} messages={{ ContactUs: messages.ContactUs }}>
            <ContactUsForm />
          </ClientMessages>
        </div>
      </div>
    </section>
  )
}
