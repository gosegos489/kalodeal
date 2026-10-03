import { revalidateTag } from 'next/cache'
import { randomUUID } from 'node:crypto'
import { MAX_IMAGE_BYTES, createListingSchema } from '@/features/create-listing/schema'
import type { CreateListingResult } from '@/features/create-listing/types'
import { canUseMarketplace } from '@/lib/account-role'
import { isActiveMarketplaceUser } from '@/lib/active-user'
import { getMutationSession } from '@/lib/auth-utils'
import { cacheTags } from '@/lib/cache-tags'
import { ListingPhotoValidationError, deleteListingPhotoObjects, prepareListingPhotos, uploadListingPhotos } from '@/lib/listing-photo-storage'
import { LISTING_SLOT_STATUSES, PLAN_LIMITS, getListingPlan } from '@/lib/plan-limits'
import prisma from '@/lib/prisma'
import { checkCreateListingRateLimit } from '@/lib/rate-limit'
import { MultipartBodyError, readMultipartFormData } from '@/lib/read-multipart-form-data'

function failure(message: string, status: number, fieldErrors?: Extract<CreateListingResult, { success: false }>['fieldErrors']) {
  return Response.json({ success: false, message, ...(fieldErrors ? { fieldErrors } : {}) } satisfies CreateListingResult, { status })
}

export async function POST(request: Request) {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  try {
    const origin = request.headers.get('origin')
    if (!origin || new URL(origin).host !== host) return failure('Invalid request origin.', 403)
  } catch {
    return failure('Invalid request origin.', 403)
  }
  const session = await getMutationSession()
  if (!session) return failure('Please sign in to publish a listing.', 401)
  if (!canUseMarketplace(session.user.role)) return failure('Moderator accounts cannot use marketplace actions.', 403)

  const userId = session.user.id
  const rateLimit = await checkCreateListingRateLimit(userId)
  if (!rateLimit.success) {
    return Response.json({ success: false, message: rateLimit.message } satisfies CreateListingResult, {
      status: rateLimit.status,
      headers: { 'Retry-After': String(rateLimit.retryAfter) }
    })
  }

  const maxBodyBytes = PLAN_LIMITS.PRO.imagesPerListing * MAX_IMAGE_BYTES + 1024 * 1024
  let payload: FormData
  try {
    payload = await readMultipartFormData(request, maxBodyBytes, 'Invalid listing data.', 'The selected photos are too large.')
  } catch (error) {
    if (error instanceof MultipartBodyError) return failure(error.message, error.status)
    return failure('Invalid listing data.', 400)
  }

  const [subscription, listingSlotCount] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId } }),
    prisma.listing.count({ where: { userId, status: { in: LISTING_SLOT_STATUSES } } })
  ])
  const plan = getListingPlan(subscription)
  const limits = PLAN_LIMITS[plan]
  if (listingSlotCount >= limits.activeListings) return failure('You have reached your listing limit, including listings awaiting moderation.', 409)

  const parsed = createListingSchema(plan).safeParse({
    title: payload.get('title'),
    categoryId: payload.get('categoryId'),
    description: payload.get('description'),
    price: payload.get('price') ?? '',
    currency: payload.get('currency'),
    phone: payload.get('phone'),
    youtube: payload.get('youtube') ?? '',
    facebookUrl: payload.get('facebookUrl') ?? '',
    messengerUrl: payload.get('messengerUrl') ?? '',
    images: payload.getAll('images')
  })
  if (!parsed.success) return failure('Please check your listing details.', 400, parsed.error.flatten().fieldErrors)

  const { images, ...details } = parsed.data
  const category = await prisma.category.findFirst({ where: { id: details.categoryId, isActive: true }, select: { id: true } })
  if (!category) return failure('Choose an available category.', 400, { categoryId: ['This category is no longer available.'] })

  const attemptedKeys: string[] = []
  let savedListing: { id: string }

  try {
    const photos = await prepareListingPhotos(images)
    const listingId = randomUUID()
    await uploadListingPhotos(userId, listingId, photos, attemptedKeys)

    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${userId} FOR UPDATE`
      if (!(await isActiveMarketplaceUser(tx, userId))) return { message: 'This account is unavailable.' }
      const currentSubscription = await tx.subscription.findUnique({ where: { userId } })
      const currentLimits = PLAN_LIMITS[getListingPlan(currentSubscription)]
      const currentCount = await tx.listing.count({ where: { userId, status: { in: LISTING_SLOT_STATUSES } } })
      if (currentCount >= currentLimits.activeListings) {
        return { message: 'You have reached your listing limit, including listings awaiting moderation.' }
      }
      if (images.length > currentLimits.imagesPerListing) {
        return { message: 'Your plan has changed. Reduce the number of photos and try again.' }
      }

      return tx.listing.create({
        data: {
          ...details,
          id: listingId,
          userId,
          status: 'PENDING',
          price: details.price || null,
          youtube: details.youtube || null,
          facebookUrl: details.facebookUrl || null,
          messengerUrl: details.messengerUrl || null,
          images: { create: attemptedKeys.map((key, sortOrder) => ({ key, sortOrder })) },
          stats: { create: {} }
        },
        select: { id: true }
      })
    })
    if ('message' in result) {
      await deleteListingPhotoObjects(attemptedKeys)
      return failure(result.message, 409)
    }
    savedListing = result
  } catch (error) {
    await deleteListingPhotoObjects(attemptedKeys)
    if (error instanceof ListingPhotoValidationError) return failure(error.message, 400, { images: [error.message] })
    console.error('Listing creation failed.', error instanceof Error ? error.name : 'Unknown error')
    return failure('Could not publish your listing. Please try again.', 500)
  }

  revalidateTag(cacheTags.listings, { expire: 0 })
  revalidateTag(cacheTags.categories, { expire: 0 })
  revalidateTag(cacheTags.categoryListings(details.categoryId), { expire: 0 })
  return Response.json({ success: true, data: savedListing } satisfies CreateListingResult, { status: 201 })
}
