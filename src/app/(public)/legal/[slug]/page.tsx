import { getLegal } from '@/entities/legal/get-legal'
import type { LegalDocumentType } from '@/generated/prisma/enums'
import { notFound } from 'next/navigation'

type Props = {
  params: Promise<{ slug: string }>
}

export default async function SlugPage({ params }: Props) {
  const { slug } = await params

  let type: LegalDocumentType

  switch (slug) {
    case 'privacy-policy':
      type = 'PRIVACY_POLICY'
      break
    case 'terms-of-use':
      type = 'TERMS_OF_USE'
      break
    default:
      notFound()
  }

  const legal = await getLegal(type)

  if (!legal) notFound()

  return (
    <article
      className="[&_a]:text-primary container space-y-6 py-12 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-6 [&_p]:leading-7 [&_section]:space-y-4 [&_ul]:list-disc"
      dangerouslySetInnerHTML={{ __html: legal.content }}
    />
  )
}
