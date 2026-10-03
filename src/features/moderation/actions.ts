'use server'

import { revalidatePath, updateTag } from 'next/cache'
import 'server-only'
import { AvatarError } from '@/features/account/settings/avatar-lifecycle'
import { getSettingsActor } from '@/features/account/settings/server'
import type { ActionMessageResult } from '@/lib/action-result'
import { hasActiveBan } from '@/lib/ban-status'
import { cacheTags } from '@/lib/cache-tags'
import prisma from '@/lib/prisma'
import { listingModerationSchema } from './schema'

export async function moderateListing(input: unknown): Promise<ActionMessageResult> {
  const parsed = listingModerationSchema.safeParse(input)
  if (!parsed.success) return { success: false, message: 'Invalid moderation request. Reload the listing and try again.' }

  let categoryId: string
  try {
    const actor = await getSettingsActor(true)
    const { id, updatedAt, decision } = parsed.data
    const result = await prisma.$transaction(async (tx): Promise<{ message: string } | { categoryId: string }> => {
      // Keep current RBAC valid for the write, even if a ban/role update races the action.
      await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${actor.id} FOR SHARE`
      const moderator = await tx.user.findUnique({ where: { id: actor.id }, select: { role: true, banned: true, banExpires: true } })
      if (!moderator || hasActiveBan(moderator) || (moderator.role !== 'moderator' && moderator.role !== 'admin')) {
        return { message: 'Moderator access is required.' }
      }
      const listing = await tx.listing.findUnique({ where: { id }, select: { status: true, updatedAt: true, categoryId: true } })
      if (!listing) return { message: 'This listing is no longer available.' }
      if (listing.status !== 'PENDING' || listing.updatedAt.toISOString() !== updatedAt) {
        return { message: 'This listing has changed or has already been reviewed. Reload it before making a decision.' }
      }
      const updated = await tx.listing.updateMany({
        where: { id, status: 'PENDING', updatedAt: listing.updatedAt },
        data: {
          status: decision === 'approve' ? 'ACTIVE' : 'REJECTED',
          updatedAt: new Date(Math.max(Date.now(), listing.updatedAt.getTime() + 1))
        }
      })
      if (updated.count !== 1) return { message: 'This listing has changed. Reload it before making a decision.' }
      return { categoryId: listing.categoryId }
    })
    if ('message' in result) return { success: false, message: result.message }
    categoryId = result.categoryId
  } catch (error) {
    if (error instanceof AvatarError) return { success: false, message: error.message }
    console.error('Could not moderate listing.')
    return { success: false, message: 'Could not moderate this listing. Please try again.' }
  }

  const message = parsed.data.decision === 'approve' ? 'Listing approved and published.' : 'Listing rejected. It remains unavailable to buyers.'
  try {
    updateTag(cacheTags.listings)
    updateTag(cacheTags.categories)
    updateTag(cacheTags.categoryListings(categoryId))
    revalidatePath('/moderator', 'layout')
    revalidatePath(`/listings/${parsed.data.id}`)
    revalidatePath('/account', 'layout')
    revalidatePath('/sell')
  } catch {
    // The decision is committed. A refresh failure must not report a failed mutation.
    console.error('Could not refresh pages after listing moderation.')
    return { success: true, message: `${message} Reload to see the updated queues.` }
  }
  return { success: true, message }
}
