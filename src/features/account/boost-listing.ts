'use server'

import { updateTag } from 'next/cache'
import 'server-only'
import { listingIdSchema } from '@/entities/listing/schema'
import { revalidateLocalizedPath as revalidatePath } from '@/i18n/revalidate-path'
import { canUseMarketplace } from '@/lib/account-role'
import type { ActionMessageResult } from '@/lib/action-result'
import { getMutationSession } from '@/lib/auth-utils'
import { cacheTags } from '@/lib/cache-tags'
import prisma from '@/lib/prisma'
import { checkBoostListingRateLimit } from '@/lib/rate-limit'
import { captureServerException } from '@/lib/sentry-server'
import { BoostError, boostListingWithCredit } from './boost-workflow'

export async function boostListing(id: unknown): Promise<ActionMessageResult> {
  const parsed = listingIdSchema.safeParse(id)
  if (!parsed.success) return { success: false, message: 'Invalid listing.' }

  let categoryId: string
  let grantReviewPath: string
  try {
    const session = await getMutationSession()
    if (!session) return { success: false, message: 'Sign in to boost your listing.' }
    if (!canUseMarketplace(session.user.role)) return { success: false, message: 'Moderator accounts cannot use marketplace actions.' }
    const userId = session.user.id
    grantReviewPath = `/moderator/access-grants/${encodeURIComponent(userId)}`
    const rateLimit = await checkBoostListingRateLimit(userId)
    if (!rateLimit.success) return { success: false, message: rateLimit.message }

    categoryId = await prisma.$transaction((tx) => boostListingWithCredit(tx, userId, parsed.data))
  } catch (error) {
    if (error instanceof BoostError) return { success: false, message: error.message }
    await captureServerException(error, { feature: 'listings', operation: 'boost', listingId: parsed.data })
    console.error('Could not boost listing.')
    return { success: false, message: 'Could not boost your listing. Please try again.' }
  }
  try {
    updateTag(cacheTags.listings)
    updateTag(cacheTags.categoryListings(categoryId))
    revalidatePath('/account', 'layout')
    revalidatePath(grantReviewPath)
    revalidatePath(`/listings/${parsed.data}`)
  } catch (error) {
    // The boost and quota debit have committed. Never invite a second debit by reporting a failed mutation.
    await captureServerException(error, { feature: 'listings', operation: 'boost-refresh', listingId: parsed.data })
    console.error('Could not refresh pages after a committed listing boost.')
    return { success: true, message: 'Your listing was boosted. Reload to see the updated listings and allowances.' }
  }
  return { success: true, message: 'Your listing has been boosted toward the top of relevant results.' }
}
