import { cacheLife, cacheTag } from 'next/cache'
import type { LegalDocumentType } from '@/generated/prisma/enums'
import { cacheTags } from '@/lib/cache-tags'
import prisma from '@/lib/prisma'
import { sanitizeLegalHtml } from './sanitize'

export async function getLegal(type: LegalDocumentType) {
  'use cache'

  cacheTag(cacheTags.legal, cacheTags.legalDocument(type))
  cacheLife('weeks')

  const legal = await prisma.legalDocument.findUnique({
    where: {
      type
    }
  })

  return legal ? { ...legal, content: sanitizeLegalHtml(legal.content) } : null
}
