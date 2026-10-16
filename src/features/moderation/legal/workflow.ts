import 'server-only'
import { hasLegalText, sanitizeLegalHtml } from '@/entities/legal/sanitize'
import type { PrismaClient } from '@/generated/prisma/client'
import { canManageLegalDocuments } from '@/lib/auth-permissions'
import { hasActiveBan } from '@/lib/ban-status'
import { LEGAL_MAX_HTML_LENGTH, legalSaveSchema } from './schema'

export class LegalDocumentError extends Error {}

type Actor = { id: string; role?: string | null; banned?: boolean | null; banExpires?: Date | null }

export function createLegalOperations({ db, actor }: { db: Pick<PrismaClient, '$transaction'>; actor: () => Promise<Actor | null> }) {
  async function save(input: unknown) {
    const user = await actor()
    if (!user || !canManageLegalDocuments(user.role) || hasActiveBan(user)) {
      throw new LegalDocumentError('Legal document management access is required. Please sign in again.')
    }
    const parsed = legalSaveSchema.safeParse(input)
    if (!parsed.success) throw new LegalDocumentError(parsed.error.issues[0].message)
    const { id, updatedAt } = parsed.data
    const content = sanitizeLegalHtml(parsed.data.content)
    if (content.length > LEGAL_MAX_HTML_LENGTH) throw new LegalDocumentError('The document is too large after HTML sanitization.')
    if (!hasLegalText(content)) throw new LegalDocumentError('The document cannot be empty. Add text before saving.')

    return db.$transaction(async (tx) => {
      // Coordinate role/ban changes with the write, following existing staff lock ordering.
      await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${user.id} FOR SHARE`
      const currentActor = await tx.user.findUnique({ where: { id: user.id }, select: { role: true, banned: true, banExpires: true } })
      if (!currentActor || !canManageLegalDocuments(currentActor.role) || hasActiveBan(currentActor)) {
        throw new LegalDocumentError('Legal document management access is required. Please sign in again.')
      }
      const current = await tx.legalDocument.findUnique({ where: { id }, select: { type: true, updatedAt: true } })
      if (!current) throw new LegalDocumentError('This document no longer exists.')
      const conflict =
        'This document was changed by another editor. Your text is preserved. Open the latest version in a new tab to compare before reloading.'
      if (current.updatedAt.toISOString() !== updatedAt) throw new LegalDocumentError(conflict)
      const version = new Date(Math.max(Date.now(), current.updatedAt.getTime() + 1))
      const result = await tx.legalDocument.updateMany({
        where: { id, updatedAt: current.updatedAt },
        data: { content, updatedAt: version }
      })
      if (result.count !== 1) throw new LegalDocumentError(conflict)
      return { id, type: current.type, content, updatedAt: version.toISOString() }
    })
  }
  return { save }
}
