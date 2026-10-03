'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import 'server-only'
import { listingIdSchema } from '@/entities/listing/schema'
import type { ActionMessageResult } from '@/lib/action-result'
import { isUnbannedUser } from '@/lib/active-user'
import { getMutationSession } from '@/lib/auth-utils'
import { cacheTags } from '@/lib/cache-tags'
import { PLAN_LIMITS, getListingPlan } from '@/lib/plan-limits'
import prisma from '@/lib/prisma'
import { checkBumpListingRateLimit } from '@/lib/rate-limit'

class BumpError extends Error {}

export async function bumpListing(id: unknown): Promise<ActionMessageResult> {
  const parsed = listingIdSchema.safeParse(id)
  if (!parsed.success) return { success: false, message: 'Invalid listing.' }

  let categoryId: string
  try {
    const session = await getMutationSession()
    if (!session) return { success: false, message: 'Sign in to bump your listing.' }
    const userId = session.user.id
    const rateLimit = await checkBumpListingRateLimit(userId)
    if (!rateLimit.success) return { success: false, message: rateLimit.message }

    categoryId = await prisma.$transaction(async (tx) => {
      // Serialize bumps with listing creation and paid-period resets in the billing webhook.
      await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${userId} FOR UPDATE`
      if (!(await isUnbannedUser(tx, userId))) throw new BumpError('This account is unavailable.')
      const now = new Date()
      const subscription = await tx.subscription.findUnique({
        where: { userId },
        select: { plan: true, status: true, currentPeriodStart: true, currentPeriodEnd: true, bumpUsed: true }
      })
      const listing = await tx.listing.findFirst({
        where: { id: parsed.data, userId, status: 'ACTIVE' },
        select: { categoryId: true }
      })
      if (!listing) throw new BumpError('Only your own active listings can be bumped.')

      const limit = PLAN_LIMITS[getListingPlan(subscription, now)].monthlyBumps
      if (!subscription || limit === 0) throw new BumpError('An eligible Pro plan is required to bump listings.')
      // A failed listing update must roll back the quota debit.
      const debited = await tx.subscription.updateMany({
        where: {
          userId,
          plan: subscription.plan,
          status: subscription.status,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          bumpUsed: { lt: limit }
        },
        data: { bumpUsed: { increment: 1 } }
      })
      if (debited.count !== 1) throw new BumpError('You have used all bumps for this paid billing period.')
      // Raw SQL preserves @updatedAt: promotion must not advance the content-edit version.
      const updated = await tx.$executeRaw`
        UPDATE listing SET "bumpedAt" = ${now}, "sortDate" = ${now}
        WHERE id = ${parsed.data} AND "userId" = ${userId} AND status = 'ACTIVE'
      `
      if (updated !== 1) throw new BumpError('This listing is no longer active.')
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
