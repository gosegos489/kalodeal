'use server'

import { revalidatePath, updateTag } from 'next/cache'
import z from 'zod'
import { listingIdSchema } from '@/entities/listing/schema'
import { canUseMarketplace } from '@/lib/account-role'
import type { ActionMessageResult } from '@/lib/action-result'
import { getMutationSession } from '@/lib/auth-utils'
import { cacheTags } from '@/lib/cache-tags'
import prisma from '@/lib/prisma'
import { checkUpdateListingRateLimit } from '@/lib/rate-limit'
import { captureServerException } from '@/lib/sentry-server'
import { FeaturedError, setFeaturedListing } from './featured-workflow'

const schema = z.object({ id: listingIdSchema, selected: z.boolean() }).strict()
export async function featureListing(input: unknown): Promise<ActionMessageResult> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { success: false, message: 'Invalid Featured Listing request.' }
  let categoryId: string
  try {
    const session = await getMutationSession()
    if (!session || !canUseMarketplace(session.user.role)) return { success: false, message: 'Sign in with a marketplace account.' }
    const limit = await checkUpdateListingRateLimit(session.user.id)
    if (!limit.success) return { success: false, message: limit.message }
    categoryId = await prisma.$transaction((tx) => setFeaturedListing(tx, session.user.id, parsed.data.id, parsed.data.selected))
  } catch (error) {
    if (error instanceof FeaturedError) return { success: false, message: error.message }
    await captureServerException(error, { feature: 'listings', operation: 'feature', listingId: parsed.data.id })
    return { success: false, message: 'Could not update Featured Listing. Please try again.' }
  }
  const message = parsed.data.selected
    ? 'Featured Listing selected. Priority applies in relevant results while Business is active.'
    : 'Featured Listing deselected.'
  try {
    updateTag(cacheTags.listings)
    updateTag(cacheTags.categoryListings(categoryId))
    revalidatePath('/account', 'layout')
    revalidatePath(`/listings/${parsed.data.id}`)
  } catch {
    return { success: true, message: `${message} Reload to see the update.` }
  }
  return { success: true, message }
}
