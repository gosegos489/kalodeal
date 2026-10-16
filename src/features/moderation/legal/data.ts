import 'server-only'
import { sanitizeLegalHtml } from '@/entities/legal/sanitize'
import prisma from '@/lib/prisma'
import { legalIdSchema } from './schema'
import { requireLegalManager } from './server'

export async function getLegalDocuments() {
  await requireLegalManager()
  return prisma.legalDocument.findMany({
    select: { id: true, type: true, updatedAt: true },
    orderBy: { type: 'asc' }
  })
}

export async function getLegalEditor(input: unknown) {
  await requireLegalManager()
  const parsed = legalIdSchema.safeParse(input)
  if (!parsed.success) return null
  const document = await prisma.legalDocument.findUnique({
    where: { id: parsed.data },
    select: { id: true, type: true, content: true, updatedAt: true }
  })
  return document ? { ...document, content: sanitizeLegalHtml(document.content), updatedAt: document.updatedAt.toISOString() } : null
}
