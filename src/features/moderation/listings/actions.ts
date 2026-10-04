'use server'

import { revalidatePath, updateTag } from 'next/cache'
import 'server-only'
import { getModerationStatusTransition } from '@/entities/listing/lifecycle'
import { AvatarError } from '@/features/account/settings/avatar-lifecycle'
import { getSettingsActor } from '@/features/account/settings/server'
import type { ActionMessageResult } from '@/lib/action-result'
import { hasActiveBan } from '@/lib/ban-status'
import { cacheTags } from '@/lib/cache-tags'
import prisma from '@/lib/prisma'
import { captureServerException } from '@/lib/sentry-server'
import { listingModerationSchema } from './schema'

export async function moderateListing(input: unknown): Promise<ActionMessageResult> {
  const parsed = listingModerationSchema.safeParse(input)
  if (!parsed.success) return { success: false, message: parsed.error.issues[0].message }
  let categories: string[]
  try {
    const actor = await getSettingsActor(true)
    const review = parsed.data
    const result = await prisma.$transaction(async (tx): Promise<{ message: string } | { categories: string[] }> => {
      // Keep fresh RBAC valid for the write, including racing role changes/bans.
      await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${actor.id} FOR SHARE`
      const moderator = await tx.user.findUnique({ where: { id: actor.id }, select: { role: true, banned: true, banExpires: true } })
      if (!moderator || hasActiveBan(moderator) || (moderator.role !== 'moderator' && moderator.role !== 'admin')) {
        return { message: 'Moderator access is required.' }
      }
      const listing = await tx.listing.findUnique({ where: { id: review.id }, select: { status: true, updatedAt: true, categoryId: true } })
      if (!listing) return { message: 'This listing is no longer available.' }
      if (listing.updatedAt.toISOString() !== review.updatedAt) return { message: 'This listing has changed. Reload it before making a decision.' }
      const version = new Date(Math.max(Date.now(), listing.updatedAt.getTime() + 1))
      if (review.decision === 'change-category') {
        if (listing.status !== 'PENDING') return { message: 'Category correction is available for listings awaiting approval.' }
        const category = await tx.category.findFirst({ where: { id: review.categoryId, isActive: true }, select: { id: true } })
        if (!category) return { message: 'Choose an available category.' }
        if (listing.categoryId === category.id) return { categories: [category.id] }
        const updated = await tx.listing.updateMany({
          where: { id: review.id, status: 'PENDING', updatedAt: listing.updatedAt },
          data: { categoryId: category.id, updatedAt: version }
        })
        if (updated.count !== 1) return { message: 'This listing has changed. Reload it before correcting its category.' }
        return { categories: [listing.categoryId, category.id] }
      }
      const status = getModerationStatusTransition(listing.status, review.decision)
      if (!status) return { message: 'This decision is unavailable for the current listing status. Reload the listing.' }
      const updated = await tx.listing.updateMany({
        where: { id: review.id, status: listing.status, updatedAt: listing.updatedAt },
        data: {
          status,
          moderationReason: 'reason' in review ? (review.reason ?? null) : null,
          moderationMessage: 'message' in review ? review.message || null : null,
          updatedAt: version
        }
      })
      if (updated.count !== 1) return { message: 'This listing has changed. Reload it before making a decision.' }
      return { categories: [listing.categoryId] }
    })
    if ('message' in result) return { success: false, message: result.message }
    categories = result.categories
  } catch (error) {
    if (error instanceof AvatarError) return { success: false, message: error.message }
    await captureServerException(error, { feature: 'listing-moderation', operation: 'review', listingId: parsed.data.id })
    console.error('Could not moderate listing.')
    return { success: false, message: 'Could not moderate this listing. Please try again.' }
  }
  const messages = {
    approve: 'Listing approved and published.',
    'request-changes': 'Changes requested. The owner can read your feedback in My listings.',
    reject: 'Listing rejected. It remains unavailable to buyers.',
    hide: 'Listing hidden by moderation. The owner can edit and submit it for review.',
    'change-category': 'Category saved. The listing is still awaiting approval; review it before approving.'
  }
  const message = messages[parsed.data.decision]
  try {
    updateTag(cacheTags.listings)
    updateTag(cacheTags.categories)
    for (const categoryId of new Set(categories)) updateTag(cacheTags.categoryListings(categoryId))
    revalidatePath('/moderator', 'layout')
    revalidatePath(`/listings/${parsed.data.id}`)
    revalidatePath('/account', 'layout')
    revalidatePath('/sell')
  } catch (error) {
    await captureServerException(error, { feature: 'listing-moderation', operation: 'refresh', listingId: parsed.data.id })
    console.error('Could not refresh pages after listing moderation.')
    return { success: true, message: `${message} Reload to see the updated queues.` }
  }
  return { success: true, message }
}
