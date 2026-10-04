'use server'

import { revalidatePath, updateTag } from 'next/cache'
import 'server-only'
import z from 'zod'
import { getEditedListingStatus, needsListingResubmission } from '@/entities/listing/lifecycle'
import { listingIdSchema } from '@/entities/listing/schema'
import { listingDetailsSchema } from '@/features/create-listing/schema'
import type { ListingStatus } from '@/generated/prisma/enums'
import { canUseMarketplace } from '@/lib/account-role'
import { isActiveMarketplaceUser } from '@/lib/active-user'
import { getMutationSession } from '@/lib/auth-utils'
import { cacheTags } from '@/lib/cache-tags'
import { ListingSlotError, checkListingSlotAvailable } from '@/lib/listing-slots'
import prisma from '@/lib/prisma'
import { checkUpdateListingRateLimit } from '@/lib/rate-limit'
import { captureServerException } from '@/lib/sentry-server'
import type { UpdateListingResult } from './types'

const updateReferenceSchema = z.object({ id: listingIdSchema, updatedAt: z.iso.datetime() }).strict()
type SavedListing = { id: string; previousCategoryId: string; categoryId: string; status: ListingStatus; changed: boolean }

export async function updateListing(id: unknown, input: unknown, expectedUpdatedAt: unknown): Promise<UpdateListingResult> {
  try {
    const session = await getMutationSession()
    if (!session) return { success: false, message: 'Sign in to edit your listing.' }
    if (!canUseMarketplace(session.user.role)) return { success: false, message: 'Moderator accounts cannot use marketplace actions.' }
    const reference = updateReferenceSchema.safeParse({ id, updatedAt: expectedUpdatedAt })
    if (!reference.success) return { success: false, message: 'Invalid listing. Reload the page and try again.' }
    // Only details enter this boundary. Status, owner, approval and feedback are server-owned.
    const parsed = listingDetailsSchema.strict().safeParse(input)
    if (!parsed.success) return { success: false, message: 'Please check your listing details.', fieldErrors: parsed.error.flatten().fieldErrors }
    const rateLimit = await checkUpdateListingRateLimit(session.user.id)
    if (!rateLimit.success) return { success: false, message: rateLimit.message }
    const userId = session.user.id
    const details = parsed.data
    const data = {
      ...details,
      price: details.price || null,
      youtube: details.youtube || null,
      facebookUrl: details.facebookUrl || null,
      messengerUrl: details.messengerUrl || null
    }
    const saved = await prisma.$transaction(async (tx): Promise<SavedListing | Omit<Extract<UpdateListingResult, { success: false }>, 'success'>> => {
      await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${userId} FOR UPDATE`
      if (!(await isActiveMarketplaceUser(tx, userId))) return { message: 'This account is unavailable.' }
      await tx.$queryRaw`SELECT id FROM listing WHERE id = ${reference.data.id} AND "userId" = ${userId} FOR UPDATE`
      const listing = await tx.listing.findFirst({
        where: { id: reference.data.id, userId },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          currency: true,
          categoryId: true,
          phone: true,
          youtube: true,
          facebookUrl: true,
          messengerUrl: true,
          status: true,
          updatedAt: true
        }
      })
      if (!listing) return { message: 'This listing is unavailable or does not belong to you.' }
      if (listing.updatedAt.toISOString() !== reference.data.updatedAt) {
        return { message: 'This listing has changed. Reload the page before editing it again.' }
      }
      const samePrice = listing.price === null ? data.price === null : data.price !== null && listing.price.equals(data.price)
      const contentChanged =
        !samePrice ||
        listingDetailsSchema
          .omit({ price: true })
          .keyof()
          .options.some((key) => listing[key] !== data[key])
      const resubmitting = needsListingResubmission(listing.status)
      if (!contentChanged && !resubmitting) {
        return { id: listing.id, previousCategoryId: listing.categoryId, categoryId: listing.categoryId, status: listing.status, changed: false }
      }
      const category = await tx.category.findFirst({ where: { id: details.categoryId, isActive: true }, select: { id: true } })
      if (!category) return { message: 'Choose an available category.', fieldErrors: { categoryId: ['This category is no longer available.'] } }
      const status = resubmitting ? 'PENDING' : getEditedListingStatus(listing.status)
      await checkListingSlotAvailable(tx, userId, listing.status, status)
      const updated = await tx.listing.updateMany({
        where: { id: listing.id, userId, updatedAt: listing.updatedAt, status: listing.status },
        data: {
          ...data,
          status,
          ...(status === 'PENDING' ? { moderationReason: null, moderationMessage: null } : {}),
          updatedAt: new Date(Math.max(Date.now(), listing.updatedAt.getTime() + 1))
        }
      })
      if (updated.count !== 1) return { message: 'This listing has changed or is unavailable. Reload the page before trying again.' }
      return { id: listing.id, previousCategoryId: listing.categoryId, categoryId: details.categoryId, status, changed: true }
    })
    if ('message' in saved) return { success: false, message: saved.message, ...('fieldErrors' in saved ? { fieldErrors: saved.fieldErrors } : {}) }
    if (saved.changed) {
      try {
        updateTag(cacheTags.listings)
        updateTag(cacheTags.categories)
        updateTag(cacheTags.categoryListings(saved.previousCategoryId))
        if (saved.categoryId !== saved.previousCategoryId) updateTag(cacheTags.categoryListings(saved.categoryId))
        revalidatePath(`/listings/${saved.id}`)
        revalidatePath('/account', 'layout')
        revalidatePath('/moderator', 'layout')
        revalidatePath('/sell')
      } catch (error) {
        // The edit is committed. Never invite a repeat submission after a refresh failure.
        await captureServerException(error, { feature: 'listings', operation: 'edit-refresh', listingId: saved.id })
        console.error('Could not refresh pages after a listing edit.')
      }
    }
    return { success: true, data: { id: saved.id, status: saved.status, changed: saved.changed } }
  } catch (error) {
    if (error instanceof ListingSlotError) return { success: false, message: error.message }
    await captureServerException(error, { feature: 'listings', operation: 'edit' })
    console.error('Could not update listing.')
    return { success: false, message: 'Could not save your listing. Please try again.' }
  }
}
