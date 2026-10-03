'use server'

import 'server-only'
import { listingIdSchema } from '@/entities/listing/schema'
import { Prisma } from '@/generated/prisma/client'
import { getMutationSession } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'
import { checkListingPhoneRevealRateLimit } from '@/lib/rate-limit'
import type { RevealListingPhoneResult } from './types'

export async function revealListingPhone(id: unknown): Promise<RevealListingPhoneResult> {
  const result = listingIdSchema.safeParse(id)
  if (!result.success) return { success: false, message: 'Invalid listing.' }

  try {
    const session = await getMutationSession()
    if (!session) return { success: false, message: 'Sign in to reveal the phone number.', requiresLogin: true }

    const rateLimit = await checkListingPhoneRevealRateLimit(session.user.id)
    if (!rateLimit.success) return { success: false, message: rateLimit.message }

    const listing = await prisma.listing.update({
      where: {
        id: result.data,
        OR: [{ status: 'ACTIVE' }, { userId: session.user.id }],
        phone: { not: '' }
      },
      data: { phoneReveals: { increment: 1 } },
      select: { phone: true }
    })

    return { success: true, data: { phone: listing.phone } }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return { success: false, message: 'This listing or phone number is unavailable.' }
    }

    console.error('Could not reveal listing phone.', error instanceof Error ? error.name : 'Unknown error')
    return { success: false, message: 'Could not reveal the phone number. Please try again.' }
  }
}
