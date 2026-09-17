import type { CreateListingResult, CreateListingValues } from './types'

export async function createListing(values: CreateListingValues): Promise<CreateListingResult> {
  const payload = new FormData()
  for (const [name, value] of Object.entries(values)) {
    if (name !== 'images') payload.set(name, value as string)
  }
  for (const image of values.images) payload.append('images', image)

  const response = await fetch('/api/listings', { method: 'POST', body: payload })
  if (!response.headers.get('content-type')?.includes('application/json')) {
    return { success: false, message: 'Could not publish your listing. Please try again.' }
  }
  return response.json()
}
