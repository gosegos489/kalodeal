import 'server-only'
import { getEditedListingStatus } from '@/entities/listing/lifecycle'
import { getListingImageUrl } from '@/entities/listing/listing-summary'
import type { Prisma } from '@/generated/prisma/client'
import { isActiveMarketplaceUser } from '@/lib/active-user'
import { deleteListingPhotoObjects, prepareListingPhotos, uploadListingPhotos } from '@/lib/listing-photo-storage'
import { checkListingSlotAvailable } from '@/lib/listing-slots'
import { type ListingPlan, PLAN_LIMITS, getListingPlan } from '@/lib/plan-limits'
import prisma from '@/lib/prisma'
import type { ListingPhotoState, PhotoMutation } from './photo-schema'

export class PhotoMutationError extends Error {
  constructor(
    message: string,
    public status = 409
  ) {
    super(message)
  }
}

const photoListingSelect = {
  id: true,
  categoryId: true,
  status: true,
  updatedAt: true,
  images: { select: { id: true, key: true, sortOrder: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }
} satisfies Prisma.ListingSelect

type PhotoListing = Prisma.ListingGetPayload<{ select: typeof photoListingSelect }>

const subscriptionSelect = { plan: true, status: true, currentPeriodStart: true, currentPeriodEnd: true } satisfies Prisma.SubscriptionSelect

function checkMutation(listing: PhotoListing | null, mutation: PhotoMutation, plan: ListingPlan) {
  if (!listing) throw new PhotoMutationError('This listing is unavailable or does not belong to you.', 404)
  if (listing.updatedAt.toISOString() !== mutation.updatedAt) {
    throw new PhotoMutationError('This listing has changed. Reload the page before editing its photos again.')
  }
  if ('imageId' in mutation && !listing.images.some((image) => image.id === mutation.imageId)) {
    throw new PhotoMutationError('This photo does not belong to your listing.', 404)
  }
  if (mutation.operation === 'reorder') {
    const ids = new Set(mutation.imageIds)
    if (ids.size !== listing.images.length || ids.size !== mutation.imageIds.length || listing.images.some((image) => !ids.has(image.id))) {
      throw new PhotoMutationError('Choose each current listing photo exactly once.', 400)
    }
  }
  if (mutation.operation === 'add' || mutation.operation === 'replace') {
    const count = listing.images.length + (mutation.operation === 'add' ? mutation.images.length : 0)
    if (count > PLAN_LIMITS[plan].imagesPerListing) {
      throw new PhotoMutationError(
        `Your current plan allows up to ${PLAN_LIMITS[plan].imagesPerListing} photos. Remove extra photos before uploading.`
      )
    }
  }
  return listing
}

function toPhotoState(listing: PhotoListing, plan: ListingPlan): ListingPhotoState {
  return {
    updatedAt: listing.updatedAt.toISOString(),
    status: listing.status,
    plan,
    images: listing.images.map(({ id, key, sortOrder }) => ({ id, url: getListingImageUrl(key), sortOrder }))
  }
}

export async function mutateListingPhotos(userId: string, listingId: string, mutation: PhotoMutation) {
  const where = { id: listingId, userId }
  const [initialListing, subscription] = await Promise.all([
    prisma.listing.findFirst({ where, select: photoListingSelect }),
    prisma.subscription.findUnique({ where: { userId }, select: subscriptionSelect })
  ])
  checkMutation(initialListing, mutation, getListingPlan(subscription))

  const attemptedKeys: string[] = []
  let saved: { data: ListingPhotoState; categoryId: string; changed: boolean; obsoleteKeys: string[] }
  try {
    if ('images' in mutation) {
      const photos = await prepareListingPhotos(mutation.images)
      await uploadListingPhotos(userId, listingId, photos, attemptedKeys)
    }

    saved = await prisma.$transaction(async (tx) => {
      // Match creation/bump's lock order. The listing lock also coordinates deletion,
      // moderation and ordinary edits, which may not acquire the user lock.
      await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${userId} FOR UPDATE`
      if (!(await isActiveMarketplaceUser(tx, userId))) throw new PhotoMutationError('This account is unavailable.', 403)
      await tx.$queryRaw`SELECT id FROM listing WHERE id = ${listingId} AND "userId" = ${userId} FOR UPDATE`
      const [currentListing, currentSubscription] = await Promise.all([
        tx.listing.findFirst({ where, select: photoListingSelect }),
        tx.subscription.findUnique({ where: { userId }, select: subscriptionSelect })
      ])
      const plan = getListingPlan(currentSubscription)
      const listing = checkMutation(currentListing, mutation, plan)
      if (mutation.operation === 'reorder' && listing.images.every((image, index) => image.id === mutation.imageIds[index])) {
        return { data: toPhotoState(listing, plan), categoryId: listing.categoryId, changed: false, obsoleteKeys: [] }
      }

      const status = getEditedListingStatus(listing.status)
      await checkListingSlotAvailable(tx, userId, listing.status, status)
      const updated = await tx.listing.updateMany({
        where: { ...where, updatedAt: listing.updatedAt, status: listing.status },
        data: {
          status,
          ...(status === 'PENDING' ? { moderationReason: null, moderationMessage: null } : {}),
          updatedAt: new Date(Math.max(Date.now(), listing.updatedAt.getTime() + 1))
        }
      })
      if (updated.count !== 1) throw new PhotoMutationError('This listing has changed. Reload the page before trying again.')

      const obsoleteKeys: string[] = []
      if (mutation.operation === 'add') {
        await tx.listingImage.createMany({
          data: attemptedKeys.map((key, index) => ({ listingId, key, sortOrder: listing.images.length + index }))
        })
      } else if (mutation.operation === 'replace' || mutation.operation === 'delete') {
        const image = listing.images.find((image) => image.id === mutation.imageId)
        if (!image) throw new PhotoMutationError('This photo does not belong to your listing.', 404)
        if (mutation.operation === 'replace') {
          const key = attemptedKeys[0]
          if (!key) throw new Error('Missing uploaded photo.')
          const replaced = await tx.listingImage.updateMany({ where: { id: image.id, listingId, key: image.key }, data: { key } })
          if (replaced.count !== 1) throw new PhotoMutationError('This photo has changed. Reload the page and try again.')
        } else {
          const deleted = await tx.listingImage.deleteMany({ where: { id: image.id, listingId, key: image.key } })
          if (deleted.count !== 1) throw new PhotoMutationError('This photo has changed. Reload the page and try again.')
        }
        obsoleteKeys.push(image.key)
      }

      const remaining = await tx.listingImage.findMany({
        where: { listingId },
        select: { id: true, sortOrder: true },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }]
      })
      const existingIds = new Set(listing.images.map((image) => image.id))
      const remainingIds = new Set(remaining.map((image) => image.id))
      const orderedIds =
        mutation.operation === 'reorder'
          ? mutation.imageIds
          : [
              ...listing.images.filter((image) => remainingIds.has(image.id)).map((image) => image.id),
              ...remaining.filter((image) => !existingIds.has(image.id)).map((image) => image.id)
            ]
      for (const [sortOrder, id] of orderedIds.entries()) {
        await tx.listingImage.updateMany({ where: { id, listingId }, data: { sortOrder } })
      }
      const result = await tx.listing.findFirst({ where, select: photoListingSelect })
      if (!result) throw new PhotoMutationError('This listing is no longer available.', 404)
      return { data: toPhotoState(result, plan), categoryId: result.categoryId, changed: true, obsoleteKeys }
    })
  } catch (error) {
    // Compensate even ambiguous or partially completed PUTs.
    await deleteListingPhotoObjects(attemptedKeys)
    throw error
  }

  // Never delete a previous image until its replacement has committed.
  // A cleanup failure must not report an already committed mutation as failed.
  const cleaned = await deleteListingPhotoObjects(saved.obsoleteKeys)
  return {
    ...saved,
    warning: cleaned ? undefined : 'Your photos were saved, but storage cleanup could not finish. Please contact support.'
  }
}
