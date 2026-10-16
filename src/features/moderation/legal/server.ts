import { redirect } from 'next/navigation'
import 'server-only'
import { canManageLegalDocuments } from '@/lib/auth-permissions'
import { getMutationSession, requireModerator } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'
import { createLegalOperations } from './workflow'

export async function requireLegalManager() {
  const session = await requireModerator()
  if (!canManageLegalDocuments(session.user.role)) redirect('/moderator')
  return session
}

export const legalOperations = createLegalOperations({ db: prisma, actor: async () => (await getMutationSession())?.user ?? null })
