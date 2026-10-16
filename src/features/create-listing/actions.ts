import { z } from 'zod'
import type { CreateListingResult, CreateListingValues } from './types'

const createListingResultSchema = z.discriminatedUnion('success', [
  z.object({ success: z.literal(true), data: z.object({ id: z.string().min(1) }) }),
  z.object({ success: z.literal(false), message: z.string(), fieldErrors: z.record(z.string(), z.array(z.string())).optional() })
])

export async function createListing({ images, ...details }: CreateListingValues): Promise<CreateListingResult> {
  const payload = new FormData()
  for (const [name, value] of Object.entries(details)) {
    payload.set(name, ['priceNegotiable', 'pricePeriod', 'propertyDetails', 'vehicleDetails'].includes(name) ? JSON.stringify(value) : String(value))
  }
  for (const image of images) payload.append('images', image)

  const response = await fetch('/api/listings', { method: 'POST', body: payload })
  if (!response.headers.get('content-type')?.includes('application/json')) {
    return { success: false, message: 'Could not publish your listing. Please try again.' }
  }
  const result = createListingResultSchema.safeParse(await response.json())
  return result.success ? result.data : { success: false, message: 'Could not confirm the result. Check My Listings before trying again.' }
}
