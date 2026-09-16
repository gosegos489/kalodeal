import type { LegalDocumentType } from '@/generated/prisma/enums'
import { cacheTags } from '@/lib/cache-tags'
import prisma from '@/lib/prisma'
import { cacheLife, cacheTag } from 'next/cache'

export async function getLegal(type: LegalDocumentType) {
  'use cache'

  cacheTag(cacheTags.legal)
  cacheLife('weeks')

  const legal = await prisma.legalDocument.findUnique({
    where: {
      type
    }
  })

  return legal
}
