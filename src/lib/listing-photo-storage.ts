import { DeleteObjectsCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'node:crypto'
import 'server-only'
import { listingImageSchema } from '@/features/create-listing/schema'
import { matchesImageType } from '@/lib/image-validation'
import { captureServerException } from '@/lib/sentry-server'

export class ListingPhotoValidationError extends Error {}

// Both create and edit use the same file policy, signature check and key format.
// There is no image conversion in the existing listing upload pipeline.
export async function prepareListingPhotos(images: File[]) {
  const photos: { bytes: Buffer; type: string }[] = []
  for (const image of images) {
    const parsed = listingImageSchema.safeParse(image)
    if (!parsed.success) throw new ListingPhotoValidationError(parsed.error.issues[0].message)
    const bytes = Buffer.from(await image.arrayBuffer())
    if (!matchesImageType(bytes, image.type)) throw new ListingPhotoValidationError('Choose valid JPEG, PNG or WebP photos.')
    photos.push({ bytes, type: image.type })
  }
  return photos
}

export async function uploadListingPhotos(
  userId: string,
  listingId: string,
  photos: Awaited<ReturnType<typeof prepareListingPhotos>>,
  attemptedKeys: string[]
) {
  if (!photos.length) return
  const { r2, R2_BUCKET_NAME } = await import('@/lib/r2')
  for (const { bytes, type } of photos) {
    const extension = type === 'image/jpeg' ? 'jpg' : type === 'image/png' ? 'png' : 'webp'
    const key = `listings/${userId}/${listingId}/${randomUUID()}.${extension}`
    // Record the key BEFORE PUT: an ambiguous network failure may have stored it.
    attemptedKeys.push(key)
    await r2.send(new PutObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key, Body: bytes, ContentType: type }), {
      abortSignal: AbortSignal.timeout(10000)
    })
  }
}

export async function deleteListingPhotoObjects(keys: string[]): Promise<boolean> {
  if (!keys.length) return true
  let pending = [...new Set(keys)]
  // R2 can return HTTP 200 with per-object errors. Retry only failed keys.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { r2, R2_BUCKET_NAME } = await import('@/lib/r2')
      const result = await r2.send(new DeleteObjectsCommand({ Bucket: R2_BUCKET_NAME, Delete: { Objects: pending.map((Key) => ({ Key })) } }), {
        abortSignal: AbortSignal.timeout(5000)
      })
      if (!result.Errors?.length) return true
      const failed = new Set(result.Errors.map((error) => error.Key))
      if (!failed.has(undefined)) pending = pending.filter((key) => failed.has(key))
      if (!pending.length) return true
    } catch {
      // Deletion is idempotent; retry all outstanding keys after transport errors.
    }
  }
  await captureServerException(new Error('Listing photo cleanup failed after retries'), { feature: 'listing-photos', operation: 'cleanup' })
  console.error('Could not clean up listing photo objects after retries.')
  return false
}
