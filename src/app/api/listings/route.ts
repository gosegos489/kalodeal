import { DeleteObjectsCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { revalidateTag } from 'next/cache'
import { randomUUID } from 'node:crypto'
import { MAX_IMAGE_BYTES, createListingSchema } from '@/features/create-listing/schema'
import type { CreateListingResult } from '@/features/create-listing/types'
import { getSession } from '@/lib/auth-utils'
import { cacheTags } from '@/lib/cache-tags'
import { PLAN_LIMITS, getListingPlan } from '@/lib/plan-limits'
import prisma from '@/lib/prisma'
import { checkCreateListingRateLimit } from '@/lib/rate-limit'

class ListingLimitError extends Error {}

function failure(message: string, status: number, fieldErrors?: Extract<CreateListingResult, { success: false }>['fieldErrors']) {
  return Response.json({ success: false, message, ...(fieldErrors ? { fieldErrors } : {}) } satisfies CreateListingResult, { status })
}

function matchesImageType(bytes: Buffer, type: string) {
  if (type === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (type === 'image/png') return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  return type === 'image/webp' && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP'
}

export async function POST(request: Request) {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  try {
    const origin = request.headers.get('origin')
    if (!origin || new URL(origin).host !== host) return failure('Invalid request origin.', 403)
  } catch {
    return failure('Invalid request origin.', 403)
  }
  const session = await getSession()
  if (!session) return failure('Please sign in to publish a listing.', 401)

  const userId = session.user.id
  const rateLimit = await checkCreateListingRateLimit(userId)
  if (!rateLimit.success) {
    return Response.json({ success: false, message: rateLimit.message } satisfies CreateListingResult, {
      status: rateLimit.status,
      headers: { 'Retry-After': String(rateLimit.retryAfter) }
    })
  }

  const maxBodyBytes = PLAN_LIMITS.PRO.imagesPerListing * MAX_IMAGE_BYTES + 1024 * 1024
  if (Number(request.headers.get('content-length')) > maxBodyBytes) return failure('The selected photos are too large.', 413)
  if (!request.headers.get('content-type')?.startsWith('multipart/form-data')) return failure('Invalid listing data.', 400)

  let payload: FormData
  try {
    payload = await request.formData()
  } catch {
    return failure('Invalid listing data.', 400)
  }

  const [subscription, activeCount] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId } }),
    prisma.listing.count({ where: { userId, status: 'ACTIVE' } })
  ])
  const plan = getListingPlan(subscription)
  const limits = PLAN_LIMITS[plan]
  if (activeCount >= limits.activeListings) return failure('You have reached your active listing limit.', 409)

  const parsed = createListingSchema(plan).safeParse({
    title: payload.get('title'),
    categoryId: payload.get('categoryId'),
    description: payload.get('description'),
    price: payload.get('price') ?? '',
    phone: payload.get('phone'),
    youtube: payload.get('youtube') ?? '',
    images: payload.getAll('images')
  })
  if (!parsed.success) return failure('Please check your listing details.', 400, parsed.error.flatten().fieldErrors)

  const { images, ...details } = parsed.data
  const category = await prisma.category.findFirst({ where: { id: details.categoryId, isActive: true }, select: { id: true } })
  if (!category) return failure('Choose an available category.', 400, { categoryId: ['This category is no longer available.'] })

  const attemptedKeys: string[] = []
  let storage: typeof import('@/lib/r2') | undefined
  let savedListing: { id: string }

  try {
    const imageData = await Promise.all(images.map(async (image) => ({ image, bytes: Buffer.from(await image.arrayBuffer()) })))
    if (imageData.some(({ image, bytes }) => !matchesImageType(bytes, image.type))) {
      return failure('Choose valid JPEG, PNG or WebP photos.', 400, { images: ['One of the files is not a valid image.'] })
    }

    if (images.length) storage = await import('@/lib/r2')
    const listingId = randomUUID()
    for (const { image, bytes } of imageData) {
      const extension = image.type === 'image/jpeg' ? 'jpg' : image.type === 'image/png' ? 'png' : 'webp'
      const key = `listings/${userId}/${listingId}/${randomUUID()}.${extension}`
      attemptedKeys.push(key)
      await storage!.r2.send(new PutObjectCommand({ Bucket: storage!.R2_BUCKET_NAME, Key: key, Body: bytes, ContentType: image.type }))
    }

    savedListing = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${userId} FOR UPDATE`
      const currentSubscription = await tx.subscription.findUnique({ where: { userId } })
      const currentLimits = PLAN_LIMITS[getListingPlan(currentSubscription)]
      const currentCount = await tx.listing.count({ where: { userId, status: 'ACTIVE' } })
      if (currentCount >= currentLimits.activeListings) throw new ListingLimitError('You have reached your active listing limit.')
      if (images.length > currentLimits.imagesPerListing)
        throw new ListingLimitError('Your plan has changed. Reduce the number of photos and try again.')

      return tx.listing.create({
        data: {
          ...details,
          id: listingId,
          userId,
          price: details.price || null,
          youtube: details.youtube || null,
          images: { create: attemptedKeys.map((key, sortOrder) => ({ key, sortOrder })) },
          stats: { create: {} }
        },
        select: { id: true }
      })
    })
  } catch (error) {
    if (storage && attemptedKeys.length) {
      try {
        await storage.r2.send(
          new DeleteObjectsCommand({ Bucket: storage.R2_BUCKET_NAME, Delete: { Objects: attemptedKeys.map((Key) => ({ Key })) } })
        )
      } catch {
        console.error('Failed to clean up photos after listing creation failed.')
      }
    }
    if (error instanceof ListingLimitError) return failure(error.message, 409)
    console.error('Listing creation failed.', error instanceof Error ? error.name : 'Unknown error')
    return failure('Could not publish your listing. Please try again.', 500)
  }

  revalidateTag(cacheTags.listings, { expire: 0 })
  revalidateTag(cacheTags.categories, { expire: 0 })
  revalidateTag(cacheTags.categoryListings(details.categoryId), { expire: 0 })
  return Response.json({ success: true, data: savedListing } satisfies CreateListingResult, { status: 201 })
}
