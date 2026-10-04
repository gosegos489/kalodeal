import { revalidatePath, revalidateTag } from 'next/cache'
import { listingIdSchema } from '@/entities/listing/schema'
import { MAX_IMAGE_BYTES } from '@/features/create-listing/schema'
import { PhotoMutationError, mutateListingPhotos } from '@/features/edit-listing/photo-mutations'
import { type PhotoMutationResult, photoMutationSchema } from '@/features/edit-listing/photo-schema'
import { canUseMarketplace } from '@/lib/account-role'
import { getMutationSession } from '@/lib/auth-utils'
import { cacheTags } from '@/lib/cache-tags'
import { ListingPhotoValidationError } from '@/lib/listing-photo-storage'
import { ListingSlotError } from '@/lib/listing-slots'
import { PLAN_LIMITS } from '@/lib/plan-limits'
import { checkListingPhotoRateLimit } from '@/lib/rate-limit'
import { MultipartBodyError, readMultipartFormData } from '@/lib/read-multipart-form-data'
import { captureServerException } from '@/lib/sentry-server'

function failure(message: string, status: number) {
  return Response.json({ success: false, message } satisfies PhotoMutationResult, { status })
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const origin = request.headers.get('origin')
    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
    if (!origin || new URL(origin).host !== host) return failure('Invalid request origin.', 403)
  } catch {
    return failure('Invalid request origin.', 403)
  }

  try {
    const session = await getMutationSession()
    if (!session) return failure('Sign in to manage your listing photos.', 401)
    if (!canUseMarketplace(session.user.role)) return failure('Moderator accounts cannot use marketplace actions.', 403)
    const reference = listingIdSchema.safeParse((await params).id)
    if (!reference.success) return failure('Invalid listing.', 400)
    const limit = await checkListingPhotoRateLimit(session.user.id)
    if (!limit.success) {
      return Response.json({ success: false, message: limit.message } satisfies PhotoMutationResult, {
        status: limit.status,
        headers: { 'Retry-After': String(limit.retryAfter) }
      })
    }

    const payload = await readMultipartFormData(
      request,
      PLAN_LIMITS.PRO.imagesPerListing * MAX_IMAGE_BYTES + 64 * 1024,
      'Invalid photo request.',
      'The selected photos are too large.'
    )
    // Validate every submitted field, including duplicates and operation-specific fields.
    const input: Record<string, unknown> = {}
    for (const key of new Set(payload.keys())) {
      const values = payload.getAll(key)
      input[key] = key === 'images' || key === 'imageIds' || values.length !== 1 ? values : values[0]
    }
    const parsed = photoMutationSchema.safeParse(input)
    if (!parsed.success) return failure(parsed.error.issues[0].message, 400)

    const saved = await mutateListingPhotos(session.user.id, reference.data, parsed.data)
    let warning = saved.warning
    if (saved.changed) {
      try {
        revalidateTag(cacheTags.listings, { expire: 0 })
        revalidateTag(cacheTags.categories, { expire: 0 })
        revalidateTag(cacheTags.categoryListings(saved.categoryId), { expire: 0 })
        revalidatePath(`/listings/${reference.data}`)
        revalidatePath('/account', 'layout')
        revalidatePath('/moderator', 'layout')
        revalidatePath('/sell')
      } catch (error) {
        await captureServerException(error, { feature: 'listing-photos', operation: 'refresh', listingId: reference.data })
        console.error('Could not refresh pages after a committed listing photo mutation.')
        warning = [warning, 'Your photos were saved. Some pages may need refreshing.'].filter(Boolean).join(' ')
      }
    }
    return Response.json({ success: true, data: saved.data, ...(warning ? { warning } : {}) } satisfies PhotoMutationResult)
  } catch (error) {
    if (error instanceof PhotoMutationError || error instanceof MultipartBodyError) return failure(error.message, error.status)
    if (error instanceof ListingPhotoValidationError) return failure(error.message, 400)
    if (error instanceof ListingSlotError) return failure(error.message, 409)
    await captureServerException(error, { feature: 'listing-photos', operation: 'mutate' })
    console.error('Could not manage listing photos.', error instanceof Error ? error.name : 'Unknown error')
    return failure('Could not save your photos. Please try again.', 500)
  }
}
