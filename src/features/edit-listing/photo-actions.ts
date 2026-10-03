import { type PhotoMutation, type PhotoMutationResult, photoMutationResultSchema } from './photo-schema'

// Browser multipart helper, not a Server Action. The endpoint owns all writes.
export async function updateListingPhotos(listingId: string, mutation: PhotoMutation): Promise<PhotoMutationResult> {
  const payload = new FormData()
  payload.set('operation', mutation.operation)
  payload.set('updatedAt', mutation.updatedAt)
  if ('imageId' in mutation) payload.set('imageId', mutation.imageId)
  if ('images' in mutation) for (const image of mutation.images) payload.append('images', image)
  if ('imageIds' in mutation) for (const id of mutation.imageIds) payload.append('imageIds', id)

  const response = await fetch(`/api/listings/${encodeURIComponent(listingId)}/photos`, { method: 'POST', body: payload })
  if (!response.headers.get('content-type')?.includes('application/json')) {
    return { success: false, message: 'Could not save your photos. Please try again.' }
  }
  const parsed = photoMutationResultSchema.safeParse(await response.json())
  return parsed.success ? parsed.data : { success: false, message: 'Could not confirm your photo changes. Reload to see the current photos.' }
}
