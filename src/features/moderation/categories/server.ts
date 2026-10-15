import 'server-only'
import { getMutationSession } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'
import { categoryIconStorage } from './icon-storage'
import { createCategoryIconOperations } from './icon-workflow'

export const categoryIcons = createCategoryIconOperations({
  db: prisma,
  actor: async () => (await getMutationSession())?.user ?? null,
  storage: categoryIconStorage
})
