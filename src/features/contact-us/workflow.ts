import type { PrismaClient } from '@/generated/prisma/client'
import type { ActionMessageResult } from '@/lib/action-result'
import { contactUsSchema } from './schema'

type Dependencies = {
  db: Pick<PrismaClient, 'contactUs'>
  limit: () => Promise<{ success: boolean; message?: string }>
}

// Keep the public boundary's existing rate-limit-before-validation behavior.
export async function submitContactUs(payload: unknown, { db, limit }: Dependencies): Promise<ActionMessageResult> {
  try {
    const rateLimit = await limit()
    if (!rateLimit.success) return { success: false, message: rateLimit.message ?? 'Please try again later.' }
    const parsed = contactUsSchema.safeParse(payload)
    if (!parsed.success) return { success: false, message: 'Invalid data' }
    await db.contactUs.create({ data: { ...parsed.data, status: 'OPEN' }, select: { id: true } })
    return { success: true, message: 'Contact us form submitted successfully' }
  } catch {
    return { success: false, message: 'Could not submit your message. Please try again.' }
  }
}
