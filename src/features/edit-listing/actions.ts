'use server'

import { updateTag } from 'next/cache'
import 'server-only'
import z from 'zod'
import { getEditedListingStatus, needsListingResubmission } from '@/entities/listing/lifecycle'
import { listingIdSchema } from '@/entities/listing/schema'
import { listingDetailsSchema, whatsappContactUrlSchema } from '@/features/create-listing/schema'
import { getAttributeValidationPrice, listingFieldErrors, validateListingCategoryAttributes } from '@/features/create-listing/validation'
import {
  buildListingAttributeReplacement,
  listingAttributeSelect,
  listingAttributesEqual,
  serializeListingAttributes
} from '@/features/listing-attributes/persistence'
import { getCategoryAttributeProfile } from '@/features/listing-attributes/rules'
import { listingAttributeInputSchema } from '@/features/listing-attributes/schema'
import type { ListingStatus } from '@/generated/prisma/enums'
import { revalidateLocalizedPath as revalidatePath } from '@/i18n/revalidate-path'
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
    if (!parsed.success) return { success: false, message: 'Please check your listing details.', fieldErrors: listingFieldErrors(parsed.error) }
    const suppliedAttributes = listingAttributeInputSchema
      .keyof()
      .options.filter((key) => typeof input === 'object' && input !== null && Object.hasOwn(input, key))
    if (suppliedAttributes.length !== 0 && suppliedAttributes.length !== 4)
      return { success: false, message: 'Submit all listing attributes together, or omit them to retain the saved values.' }
    const rateLimit = await checkUpdateListingRateLimit(session.user.id)
    if (!rateLimit.success) return { success: false, message: rateLimit.message }
    const userId = session.user.id
    const details = parsed.data
    const { propertyDetails, vehicleDetails, priceNegotiable, pricePeriod, ...common } = details
    const data = {
      ...common,
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
          ...listingAttributeSelect,
          id: true,
          title: true,
          description: true,
          price: true,
          currency: true,
          categoryId: true,
          category: { select: { slug: true } },
          district: true,
          area: true,
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
      if (details.messengerUrl !== (listing.messengerUrl ?? '')) {
        const contact = whatsappContactUrlSchema.safeParse(details.messengerUrl)
        if (!contact.success)
          return { message: 'Please check your WhatsApp link.', fieldErrors: { messengerUrl: contact.error.issues.map((issue) => issue.message) } }
      }
      const previousAttributes = serializeListingAttributes({
        priceNegotiable: listing.priceNegotiable,
        pricePeriod: listing.pricePeriod,
        propertyDetails: listing.propertyDetails,
        vehicleDetails: listing.vehicleDetails
      })
      const nextAttributes = suppliedAttributes.length ? { propertyDetails, vehicleDetails, priceNegotiable, pricePeriod } : previousAttributes
      const previous = { ...previousAttributes, categoryId: listing.categoryId, price: listing.price?.toString() ?? '' }
      const category = await tx.category.findFirst({ where: { id: details.categoryId, isActive: true }, select: { id: true, slug: true } })
      const slug = category?.slug ?? (details.categoryId === listing.categoryId ? listing.category.slug : null)
      if (!slug) return { message: 'Choose an available category.', fieldErrors: { categoryId: ['This category is no longer available.'] } }
      const attributes = validateListingCategoryAttributes(slug, { ...details, ...nextAttributes }, previous)
      if (!attributes.success) return { message: 'Please check your listing attributes.', fieldErrors: listingFieldErrors(attributes.error) }
      const samePrice = listing.price === null ? data.price === null : data.price !== null && listing.price.equals(data.price)
      const attributesChanged = !listingAttributesEqual(previousAttributes, attributes.data)
      const contentChanged =
        !samePrice || (Object.keys(data) as (keyof typeof data)[]).some((key) => key !== 'price' && listing[key] !== data[key]) || attributesChanged
      const resubmitting = needsListingResubmission(listing.status)
      if (!contentChanged && !resubmitting) {
        return { id: listing.id, previousCategoryId: listing.categoryId, categoryId: listing.categoryId, status: listing.status, changed: false }
      }
      if (!category) return { message: 'Choose an available category.', fieldErrors: { categoryId: ['This category is no longer available.'] } }
      const status = resubmitting ? 'PENDING' : getEditedListingStatus(listing.status)
      await checkListingSlotAvailable(tx, userId, listing.status, status)
      const updated = await tx.listing.updateMany({
        where: { id: listing.id, userId, updatedAt: listing.updatedAt, status: listing.status },
        data: {
          ...data,
          status,
          ...(status !== 'ACTIVE' ? { featuredAt: null } : {}),
          ...(status === 'PENDING' ? { moderationReason: null, moderationMessage: null } : {}),
          updatedAt: new Date(Math.max(Date.now(), listing.updatedAt.getTime() + 1))
        }
      })
      if (updated.count !== 1) return { message: 'This listing has changed or is unavailable. Reload the page before trying again.' }
      // Relations and base fields commit together, only after the conditional owner/version write succeeds.
      if (attributesChanged) {
        const replacement = buildListingAttributeReplacement(
          getCategoryAttributeProfile(category.slug),
          getAttributeValidationPrice({ ...details, ...attributes.data }, previous),
          attributes.data,
          { propertyDetails: listing.propertyDetails !== null, vehicleDetails: listing.vehicleDetails !== null }
        )
        await tx.listing.update({
          where: { id: listing.id },
          data: { ...replacement, updatedAt: new Date(Math.max(Date.now(), listing.updatedAt.getTime() + 1)) },
          select: { id: true }
        })
      }
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
