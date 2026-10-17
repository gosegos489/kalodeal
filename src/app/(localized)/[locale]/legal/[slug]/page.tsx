import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { legalContentClassName, legalDocuments } from '@/entities/legal/documents'
import { getLegal } from '@/entities/legal/get-legal'
import { LegalDocumentType } from '@/generated/prisma/enums'
import { localizeHref } from '@/i18n/routing'
import { buildBreadcrumbJsonLd } from '@/lib/json-ld'
import { buildMetadata } from '@/lib/metadata'
import { cn } from '@/lib/utils'
import { JsonLd } from '@/shared/ui/json-ld'

type Props = {
  params: Promise<{ slug: string }>
}

const getLegalPage = cache(async (slug: string) => {
  const type = Object.values(LegalDocumentType).find((type) => legalDocuments[type].slug === slug)
  if (!type) return null
  const { title, description } = legalDocuments[type]

  const legal = await getLegal(type)

  if (!legal) return null

  return { legal, title, description }
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const document = await getLegalPage(slug)
  if (!document) notFound()
  const { title, description } = document
  // Both UI locales show the same English document. Keep one indexable canonical
  // and do not advertise the Greek UI shell as a translated legal document.
  return buildMetadata({ title, description, path: `/legal/${slug}` })
}

export default async function SlugPage({ params }: Props) {
  const { slug } = await params
  const document = await getLegalPage(slug)
  if (!document) notFound()
  const { legal, title } = document
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'Categories' })

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { label: t('home'), href: localizeHref('/', locale) },
          { label: title, href: localizeHref(`/legal/${slug}`, locale) }
        ])}
      />
      <article lang="en" className={cn(legalContentClassName, 'container py-12')} dangerouslySetInnerHTML={{ __html: legal.content }} />
    </>
  )
}
