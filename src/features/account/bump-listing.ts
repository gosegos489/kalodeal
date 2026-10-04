'use server'

import { revalidatePath, updateTag } from 'next/cache'
import 'server-only'
import { listingIdSchema } from '@/entities/listing/schema'
import { canUseMarketplace } from '@/lib/account-role'
import type { ActionMessageResult } from '@/lib/action-result'
import { getMutationSession } from '@/lib/auth-utils'
import { cacheTags } from '@/lib/cache-tags'
import prisma from '@/lib/prisma'
import { checkBumpListingRateLimit } from '@/lib/rate-limit'
import { captureServerException } from '@/lib/sentry-server'
import { BumpError, bumpListingWithCredit } from './bump-workflow'

export async function bumpListing(id: unknown): Promise<ActionMessageResult> {
  const parsed = listingIdSchema.safeParse(id)
  if (!parsed.success) return { success: false, message: 'Invalid listing.' }

  let categoryId: string
  let grantReviewPath: string
  try {
    const session = await getMutationSession()
    if (!session) return { success: false, message: 'Sign in to bump your listing.' }
    if (!canUseMarketplace(session.user.role)) return { success: false, message: 'Moderator accounts cannot use marketplace actions.' }
    const userId = session.user.id
    grantReviewPath = `/moderator/access-grants/${encodeURIComponent(userId)}`
    const rateLimit = await checkBumpListingRateLimit(userId)
    if (!rateLimit.success) return { success: false, message: rateLimit.message }

    categoryId = await prisma.$transaction((tx) => bumpListingWithCredit(tx, userId, parsed.data))
  } catch (error) {
    if (error instanceof BumpError) return { success: false, message: error.message }
    await captureServerException(error, { feature: 'listings', operation: 'bump', listingId: parsed.data })
    console.error('Could not bump listing.')
    return { success: false, message: 'Could not bump your listing. Please try again.' }
  }
  try {
    updateTag(cacheTags.listings)
    updateTag(cacheTags.categoryListings(categoryId))
    revalidatePath('/account', 'layout')
    revalidatePath(grantReviewPath)
    revalidatePath(`/listings/${parsed.data}`)
  } catch (error) {
    // The bump and quota debit have committed. Never invite a second debit by reporting a failed mutation.
    await captureServerException(error, { feature: 'listings', operation: 'bump-refresh', listingId: parsed.data })
    console.error('Could not refresh pages after a committed listing bump.')
    return { success: true, message: 'Your listing was bumped. Reload to see the updated listings and allowances.' }
  }
  return { success: true, message: 'Your listing has moved to the top of the latest listings.' }
}
