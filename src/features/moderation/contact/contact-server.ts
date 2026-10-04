import 'server-only'
import { getMutationSession } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'
import { createContactOperations } from './contact-workflow'

export const contactRequests = createContactOperations({
  db: prisma,
  moderatorActor: async () => (await getMutationSession())?.user ?? null
})
