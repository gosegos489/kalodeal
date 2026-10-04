'use server'

import { revalidatePath, updateTag } from 'next/cache'
import 'server-only'
import z from 'zod'
import { getOwnerStatusTransition } from '@/entities/listing/lifecycle'
import { listingIdSchema } from '@/entities/listing/schema'
import { canUseMarketplace } from '@/lib/account-role'
import type { ActionMessageResult } from '@/lib/action-result'
import { isActiveMarketplaceUser } from '@/lib/active-user'
import { getMutationSession } from '@/lib/auth-utils'
import { cacheTags } from '@/lib/cache-tags'
import { ListingSlotError, checkListingSlotAvailable } from '@/lib/listing-slots'
import prisma from '@/lib/prisma'
import { checkUpdateListingRateLimit } from '@/lib/rate-limit'
import { captureServerException } from '@/lib/sentry-server'

const ownerListingActionSchema = z
  .object({
    id: listingIdSchema,
    updatedAt: z.iso.datetime(),
    action: z.enum(['hide', 'unhide', 'mark-sold'])
  })
  .strict()

export async function changeListingVisibility(input: unknown): Promise<ActionMessageResult> {
  const parsed = ownerListingActionSchema.safeParse(input)
  if (!parsed.success) return { success: false, message: 'Invalid listing action. Reload and try again.' }
  let categoryId: string
  try {
    const session = await getMutationSession()
    if (!session) return { success: false, message: 'Sign in to manage your listing.' }
    if (!canUseMarketplace(session.user.role)) return { success: false, message: 'Moderator accounts cannot use marketplace actions.' }
    const rateLimit = await checkUpdateListingRateLimit(session.user.id)
    if (!rateLimit.success) return { success: false, message: rateLimit.message }
    const { id, action, updatedAt } = parsed.data
    const userId = session.user.id
    const result = await prisma.$transaction(async (tx): Promise<{ message: string } | { categoryId: string }> => {
      await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${userId} FOR UPDATE`
      if (!(await isActiveMarketplaceUser(tx, userId))) return { message: 'This account is unavailable.' }
      await tx.$queryRaw`SELECT id FROM listing WHERE id = ${id} AND "userId" = ${userId} FOR UPDATE`
      const listing = await tx.listing.findFirst({ where: { id, userId }, select: { status: true, categoryId: true, updatedAt: true } })
      if (!listing) return { message: 'This listing is unavailable or does not belong to you.' }
      if (listing.updatedAt.toISOString() !== updatedAt) return { message: 'This listing has changed. Reload before trying again.' }
      const status = getOwnerStatusTransition(listing.status, action)
      if (!status) return { message: 'This action is unavailable for the current listing status.' }
      if (action === 'unhide') {
        const category = await tx.category.findFirst({ where: { id: listing.categoryId, isActive: true }, select: { id: true } })
        if (!category) return { message: 'Edit your listing to choose an available category and submit it for approval.' }
      }
      await checkListingSlotAvailable(tx, userId, listing.status, status)
      const updated = await tx.listing.updateMany({
        where: { id, userId, status: listing.status, updatedAt: listing.updatedAt },
        data: { status, updatedAt: new Date(Math.max(Date.now(), listing.updatedAt.getTime() + 1)) }
      })
      return updated.count === 1 ? { categoryId: listing.categoryId } : { message: 'This listing has changed. Reload before trying again.' }
    })
    if ('message' in result) return { success: false, message: result.message }
    categoryId = result.categoryId
  } catch (error) {
    if (error instanceof ListingSlotError) return { success: false, message: error.message }
    await captureServerException(error, { feature: 'listings', operation: 'visibility', listingId: parsed.data.id })
    console.error('Could not change listing visibility.')
    return { success: false, message: 'Could not update your listing. Please try again.' }
  }
  const messages = {
    hide: 'Your listing is hidden. You can unhide it from My listings.',
    unhide: 'Your listing is public again.',
    'mark-sold': 'Your listing is marked as sold.'
  }
  const message = messages[parsed.data.action]
  try {
    updateTag(cacheTags.listings)
    updateTag(cacheTags.categories)
    updateTag(cacheTags.categoryListings(categoryId))
    revalidatePath(`/listings/${parsed.data.id}`)
    revalidatePath('/account', 'layout')
    revalidatePath('/moderator', 'layout')
    revalidatePath('/sell')
  } catch (error) {
    await captureServerException(error, { feature: 'listings', operation: 'visibility-refresh', listingId: parsed.data.id })
    console.error('Could not refresh pages after listing visibility changed.')
    return { success: true, message: `${message} Reload to see the updated listings.` }
  }
  return { success: true, message }
}
