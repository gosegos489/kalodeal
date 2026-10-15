import { PutObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'node:crypto'
import 'server-only'
import { MAX_PHOTO_BATCH_BYTES, listingImageSchema } from '@/features/create-listing/schema'
import { matchesImageType } from '@/lib/image-validation'
import { deleteR2Objects } from '@/lib/r2-object-cleanup'

export class ListingPhotoValidationError extends Error {}

// Both create and edit use the same file policy, signature check and key format.
// There is no image conversion in the existing listing upload pipeline.
export async function prepareListingPhotos(images: File[]) {
  if (images.reduce((bytes, image) => bytes + image.size, 0) > MAX_PHOTO_BATCH_BYTES)
    throw new ListingPhotoValidationError('Use no more than 50 MB of photos per upload. Add remaining photos in smaller batches.')
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

export function deleteListingPhotoObjects(keys: string[]): Promise<boolean> {
  return deleteR2Objects(keys, 'listing-photos')
}
