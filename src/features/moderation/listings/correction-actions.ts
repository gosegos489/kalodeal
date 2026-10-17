'use server'

import { updateTag } from 'next/cache'
import 'server-only'
import { AvatarError } from '@/features/account/settings/avatar-lifecycle'
import { getSettingsActor } from '@/features/account/settings/server'
import { getAttributeValidationPrice, listingFieldErrors, validateListingCategoryAttributes } from '@/features/create-listing/validation'
import { getIncompatibleAttributeLoss } from '@/features/listing-attributes/category-change'
import {
  buildListingAttributeReplacement,
  listingAttributeSelect,
  listingAttributesEqual,
  serializeListingAttributes
} from '@/features/listing-attributes/persistence'
import { getCategoryAttributeProfile } from '@/features/listing-attributes/rules'
import { revalidateLocalizedPath as revalidatePath } from '@/i18n/revalidate-path'
import { hasActiveBan } from '@/lib/ban-status'
import { cacheTags } from '@/lib/cache-tags'
import prisma from '@/lib/prisma'
import { checkUpdateListingRateLimit } from '@/lib/rate-limit'
import { captureServerException } from '@/lib/sentry-server'
import { type ListingCorrectionResult, listingCorrectionSchema } from './correction-schema'

type SavedCorrection = { id: string; categories: string[]; changed: boolean }

export async function correctModeratedListing(input: unknown): Promise<ListingCorrectionResult> {
  let saved: SavedCorrection
  try {
    const actor = await getSettingsActor(true)
    const parsed = listingCorrectionSchema.safeParse(input)
    if (!parsed.success) return { success: false, message: 'Please check the correction fields.', fieldErrors: listingFieldErrors(parsed.error) }
    const rateLimit = await checkUpdateListingRateLimit(actor.id)
    if (!rateLimit.success) return { success: false, message: rateLimit.message }
    const correction = parsed.data
    const result = await prisma.$transaction(
      async (tx): Promise<SavedCorrection | Omit<Extract<ListingCorrectionResult, { success: false }>, 'success'>> => {
        // User before listing, matching existing owner edits/photos. Staff never
        // claims the owner's quota lock or changes reserved-slot membership here.
        await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${actor.id} FOR SHARE`
        const moderator = await tx.user.findUnique({ where: { id: actor.id }, select: { role: true, banned: true, banExpires: true } })
        if (!moderator || hasActiveBan(moderator) || (moderator.role !== 'moderator' && moderator.role !== 'admin'))
          return { message: 'Moderator access is required.' }
        await tx.$queryRaw`SELECT id FROM listing WHERE id = ${correction.id} FOR UPDATE`
        const listing = await tx.listing.findUnique({
          where: { id: correction.id },
          select: {
            ...listingAttributeSelect,
            id: true,
            categoryId: true,
            category: { select: { slug: true } },
            district: true,
            area: true,
            price: true,
            status: true,
            updatedAt: true
          }
        })
        if (!listing) return { message: 'This listing is no longer available.' }
        if (listing.updatedAt.toISOString() !== correction.updatedAt)
          return { message: 'This listing has changed. Load the latest version before saving corrections.' }
        const categoryChanged = listing.categoryId !== correction.categoryId
        if (categoryChanged && listing.status !== 'PENDING')
          return { message: 'Category correction is available only for listings awaiting approval.' }
        if (correction.district === null && (listing.district !== null || listing.area !== null))
          return { message: 'Choose a district and area. An existing location cannot be cleared.', fieldErrors: { district: ['Choose a district.'] } }
        const category = categoryChanged
          ? await tx.category.findFirst({ where: { id: correction.categoryId, isActive: true }, select: { slug: true } })
          : listing.category
        if (!category) return { message: 'Choose an available category.', fieldErrors: { categoryId: ['This category is no longer available.'] } }
        const previous = serializeListingAttributes(listing)
        const price = listing.price?.toString() ?? ''
        const previousValues = { ...previous, price, categoryId: listing.categoryId }
        const values = { ...correction, price }
        const validated = validateListingCategoryAttributes(category.slug, values, previousValues)
        if (!validated.success) return { message: 'Please check the listing attributes.', fieldErrors: listingFieldErrors(validated.error) }
        const removed = getIncompatibleAttributeLoss(category.slug, previous, validated.data)
        if (removed.length && !correction.confirmAttributeRemoval)
          return { message: 'Confirm removal of incompatible saved details before saving. No data has been changed.' }
        const attributesChanged = !listingAttributesEqual(previous, validated.data)
        const changed = categoryChanged || listing.district !== correction.district || listing.area !== correction.area || attributesChanged
        if (!changed) return { id: listing.id, categories: [listing.categoryId], changed: false }
        const version = new Date(Math.max(Date.now(), listing.updatedAt.getTime() + 1))
        const updated = await tx.listing.updateMany({
          where: { id: listing.id, status: listing.status, updatedAt: listing.updatedAt },
          data: { categoryId: correction.categoryId, district: correction.district, area: correction.area, updatedAt: version }
        })
        if (updated.count !== 1) return { message: 'This listing has changed. Load the latest version before saving corrections.' }
        if (attributesChanged) {
          const replacement = buildListingAttributeReplacement(
            getCategoryAttributeProfile(category.slug),
            getAttributeValidationPrice(values, previousValues),
            validated.data,
            { propertyDetails: listing.propertyDetails !== null, vehicleDetails: listing.vehicleDetails !== null }
          )
          // Nested replacement and category/location commit atomically. Any error
          // rolls back the conditional write above. Status/feedback stay intact.
          await tx.listing.update({ where: { id: listing.id }, data: { ...replacement, updatedAt: version }, select: { id: true } })
        }
        return { id: listing.id, categories: [listing.categoryId, correction.categoryId], changed: true }
      }
    )
    if ('message' in result)
      return { success: false, message: result.message, ...('fieldErrors' in result ? { fieldErrors: result.fieldErrors } : {}) }
    saved = result
  } catch (error) {
    if (error instanceof AvatarError) return { success: false, message: error.message }
    await captureServerException(error, { feature: 'listing-moderation', operation: 'correct' })
    console.error('Could not correct listing details.')
    return { success: false, message: 'Could not save the corrections. Please try again.' }
  }
  if (!saved.changed) return { success: true, changed: false, message: 'No changes to save. The listing status is unchanged.' }
  const message = 'Corrections saved. The listing status and owner feedback are unchanged. Review the latest version before making a decision.'
  try {
    updateTag(cacheTags.listings)
    updateTag(cacheTags.categories)
    for (const categoryId of new Set(saved.categories)) updateTag(cacheTags.categoryListings(categoryId))
    revalidatePath(`/listings/${saved.id}`)
    revalidatePath('/moderator', 'layout')
    revalidatePath('/account', 'layout')
    revalidatePath('/sell')
  } catch (error) {
    await captureServerException(error, { feature: 'listing-moderation', operation: 'correct-refresh', listingId: saved.id })
    return { success: true, changed: true, message: `${message} Reload the page to see the saved changes.` }
  }
  return { success: true, changed: true, message }
}
