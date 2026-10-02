'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import 'server-only'
import { listingIdSchema } from '@/entities/listing/schema'
import type { ActionMessageResult } from '@/lib/action-result'
import { getSession } from '@/lib/auth-utils'
import { cacheTags } from '@/lib/cache-tags'
import { PLAN_LIMITS, getListingPlan } from '@/lib/plan-limits'
import prisma from '@/lib/prisma'

class BumpError extends Error {}

export async function bumpListing(id: unknown): Promise<ActionMessageResult> {
  const parsed = listingIdSchema.safeParse(id)
  if (!parsed.success) return { success: false, message: 'Invalid listing.' }

  let categoryId: string
  try {
    const session = await getSession()
    if (!session) return { success: false, message: 'Sign in to bump your listing.' }
    const userId = session.user.id
    categoryId = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${userId} FOR UPDATE`
      const now = new Date()
      const subscription = await tx.subscription.findUnique({ where: { userId } })
      const limit = PLAN_LIMITS[getListingPlan(subscription, now)].monthlyBumps
      if (!subscription || limit === 0) throw new BumpError('An eligible Pro plan is required to bump listings.')
      if (subscription.bumpUsed >= limit) throw new BumpError('You have used all bumps for this paid billing period.')
      const listing = await tx.listing.findFirst({ where: { id: parsed.data, userId, status: 'ACTIVE' }, select: { categoryId: true } })
      if (!listing) throw new BumpError('Only your own active listings can be bumped.')
      // Repeat the ownership/status condition at the write boundary, including concurrent moderation/deletion.
      const updated = await tx.listing.updateMany({
        where: { id: parsed.data, userId, status: 'ACTIVE' },
        data: { bumpedAt: now, sortDate: now }
      })
      if (updated.count !== 1) throw new BumpError('This listing is no longer active.')
      await tx.subscription.update({ where: { userId }, data: { bumpUsed: { increment: 1 } } })
      return listing.categoryId
    })
  } catch (error) {
    if (error instanceof BumpError) return { success: false, message: error.message }
    console.error('Could not bump listing.')
    return { success: false, message: 'Could not bump your listing. Please try again.' }
  }
  try {
    revalidateTag(cacheTags.listings, { expire: 0 })
    revalidateTag(cacheTags.categoryListings(categoryId), { expire: 0 })
    revalidatePath('/account', 'layout')
    revalidatePath(`/listings/${parsed.data}`)
  } catch {
    // The bump and quota debit have committed. Never invite a second debit by reporting a failed mutation.
    console.error('Could not refresh pages after a committed listing bump.')
    return { success: true, message: 'Your listing was bumped. Reload to see the updated listings and allowances.' }
  }
  return { success: true, message: 'Your listing has moved to the top of the latest listings.' }
}
