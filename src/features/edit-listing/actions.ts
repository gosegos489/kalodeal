'use server'

import { revalidatePath, updateTag } from 'next/cache'
import 'server-only'
import z from 'zod'
import { listingIdSchema } from '@/entities/listing/schema'
import { listingDetailsSchema } from '@/features/create-listing/schema'
import type { ListingStatus } from '@/generated/prisma/enums'
import { getSession } from '@/lib/auth-utils'
import { cacheTags } from '@/lib/cache-tags'
import prisma from '@/lib/prisma'
import { checkUpdateListingRateLimit } from '@/lib/rate-limit'
import type { UpdateListingResult } from './types'

const updateReferenceSchema = z.object({ id: listingIdSchema, updatedAt: z.iso.datetime() })

export async function updateListing(id: unknown, input: unknown, expectedUpdatedAt: unknown): Promise<UpdateListingResult> {
  let saved: { id: string; previousCategoryId: string; categoryId: string; status: ListingStatus }
  try {
    const session = await getSession(true)
    if (!session || session.user.banned) return { success: false, message: 'Sign in to edit your listing.' }

    const reference = updateReferenceSchema.safeParse({ id, updatedAt: expectedUpdatedAt })
    if (!reference.success) return { success: false, message: 'Invalid listing. Reload the page and try again.' }
    const userId = session.user.id
    const listing = await prisma.listing.findFirst({
      where: { id: reference.data.id, userId },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        categoryId: true,
        phone: true,
        youtube: true,
        facebookUrl: true,
        messengerUrl: true,
        status: true,
        updatedAt: true
      }
    })
    if (!listing) return { success: false, message: 'This listing is unavailable or does not belong to you.' }
    if (listing.updatedAt.toISOString() !== reference.data.updatedAt) {
      return { success: false, message: 'This listing has changed. Reload the page before editing it again.' }
    }

    // Text edits reject server-only fields; photo operations have their own boundary.
    const parsed = listingDetailsSchema.strict().safeParse(input)
    if (!parsed.success) return { success: false, message: 'Please check your listing details.', fieldErrors: parsed.error.flatten().fieldErrors }

    const details = parsed.data
    const data = {
      title: details.title,
      description: details.description,
      price: details.price || null,
      categoryId: details.categoryId,
      phone: details.phone,
      youtube: details.youtube || null,
      facebookUrl: details.facebookUrl || null,
      messengerUrl: details.messengerUrl || null
    }
    const samePrice = listing.price === null ? data.price === null : data.price !== null && listing.price.equals(data.price)
    const changed =
      !samePrice ||
      listingDetailsSchema
        .omit({ price: true })
        .keyof()
        .options.some((key) => listing[key] !== data[key])
    if (!changed) return { success: true, data: { id: listing.id, status: listing.status, changed: false } }

    const rateLimit = await checkUpdateListingRateLimit(userId)
    if (!rateLimit.success) return { success: false, message: rateLimit.message }

    const category = await prisma.category.findFirst({ where: { id: details.categoryId, isActive: true }, select: { id: true } })
    if (!category) {
      return { success: false, message: 'Choose an available category.', fieldErrors: { categoryId: ['This category is no longer available.'] } }
    }

    // ACTIVE -> PENDING keeps the same reserved slot; other statuses are not republished by editing.
    const status = listing.status === 'ACTIVE' ? 'PENDING' : listing.status
    const updated = await prisma.listing.updateMany({
      where: { id: listing.id, userId, updatedAt: listing.updatedAt, status: listing.status },
      data: { ...data, status }
    })
    if (updated.count !== 1) {
      return { success: false, message: 'This listing has changed or is unavailable. Reload the page before trying again.' }
    }
    saved = { id: listing.id, previousCategoryId: listing.categoryId, categoryId: details.categoryId, status }
  } catch {
    console.error('Could not update listing.')
    return { success: false, message: 'Could not save your listing. Please try again.' }
  }

  updateTag(cacheTags.listings)
  updateTag(cacheTags.categories)
  updateTag(cacheTags.categoryListings(saved.previousCategoryId))
  if (saved.categoryId !== saved.previousCategoryId) updateTag(cacheTags.categoryListings(saved.categoryId))
  revalidatePath(`/listings/${saved.id}`)
  revalidatePath('/account', 'layout')
  revalidatePath('/sell')

  return { success: true, data: { id: saved.id, status: saved.status, changed: true } }
}
