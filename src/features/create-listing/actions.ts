import type { CreateListingResult, CreateListingValues } from './types'

export async function createListing({ images, ...details }: CreateListingValues): Promise<CreateListingResult> {
  const payload = new FormData()
  for (const [name, value] of Object.entries(details)) payload.set(name, value)
  for (const image of images) payload.append('images', image)

  const response = await fetch('/api/listings', { method: 'POST', body: payload })
  if (!response.headers.get('content-type')?.includes('application/json')) {
    return { success: false, message: 'Could not publish your listing. Please try again.' }
  }
  return response.json()
}
