import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { getLegal } from '@/entities/legal/get-legal'
import type { LegalDocumentType } from '@/generated/prisma/enums'
import { buildBreadcrumbJsonLd } from '@/lib/json-ld'
import { buildMetadata } from '@/lib/metadata'
import { JsonLd } from '@/shared/ui/json-ld'

type Props = {
  params: Promise<{ slug: string }>
}

const getLegalPage = cache(async (slug: string) => {
  let type: LegalDocumentType
  let title: string
  let description: string

  switch (slug) {
    case 'privacy-policy':
      type = 'PRIVACY_POLICY'
      title = 'Privacy Policy'
      description =
        'Read how Kalodeal collects and uses personal information, handles cookies, and protects your privacy when you use the marketplace.'
      break
    case 'terms-of-use':
      type = 'TERMS_OF_USE'
      title = 'Terms of Use'
      description =
        'Read the terms for using Kalodeal, including accounts, listings, prohibited conduct, and transactions between buyers and sellers.'
      break
    default:
      return null
  }

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
      <article
        className="[&_a]:text-primary container space-y-6 py-12 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-6 [&_p]:leading-7 [&_section]:space-y-4 [&_ul]:list-disc"
        dangerouslySetInnerHTML={{ __html: legal.content }}
      />
    </>
  )
}
