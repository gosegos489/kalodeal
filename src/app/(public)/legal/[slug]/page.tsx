import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { legalContentClassName, legalDocuments } from '@/entities/legal/documents'
import { getLegal } from '@/entities/legal/get-legal'
import { LegalDocumentType } from '@/generated/prisma/enums'
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
  return buildMetadata({ title, description, path: `/legal/${slug}` })
}

export default async function SlugPage({ params }: Props) {
  const { slug } = await params
  const document = await getLegalPage(slug)
  if (!document) notFound()
  const { legal, title } = document

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { label: 'Home', href: '/' },
          { label: title, href: `/legal/${slug}` }
        ])}
      />
      <article lang="en" className={cn(legalContentClassName, 'container py-12')} dangerouslySetInnerHTML={{ __html: legal.content }} />
    </>
  )
}
