import { redirect } from 'next/navigation'
import 'server-only'
import { canManageCategoryIcons } from '@/lib/auth-permissions'
import { getMutationSession, requireModerator } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'
import { categoryIconStorage } from './icon-storage'
import { createCategoryIconOperations } from './icon-workflow'

export async function requireCategoryIconManager() {
  const session = await requireModerator()
  if (!canManageCategoryIcons(session.user.role)) redirect('/moderator')
  return session
}

export const categoryIcons = createCategoryIconOperations({
  db: prisma,
  actor: async () => (await getMutationSession())?.user ?? null,
  storage: categoryIconStorage
})
