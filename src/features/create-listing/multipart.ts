import { createListingSchema } from './schema'

// Only images may repeat. Unknown transport fields are rejected, never stripped.
// Optional attribute values travel as JSON null/number/boolean, not coerced strings.
export function readListingPayload(payload: FormData) {
  const fields = new Set<string>(createListingSchema().keyof().options)
  const input: Record<string, unknown> = { images: payload.getAll('images') }
  for (const name of new Set(payload.keys())) {
    if (!fields.has(name) || (name !== 'images' && payload.getAll(name).length !== 1)) {
      return { success: false as const, message: 'Unknown or repeated listing field.' }
    }
    if (name === 'images') continue
    const value = payload.get(name)
    if (typeof value !== 'string') return { success: false as const, message: 'Invalid listing field.' }
    if (['priceNegotiable', 'pricePeriod', 'propertyDetails', 'vehicleDetails'].includes(name)) {
      if (value.length > 16_384) return { success: false as const, message: 'Listing attributes are too large.' }
      try {
        input[name] = JSON.parse(value)
      } catch {
        return { success: false as const, message: 'Invalid listing attributes.' }
      }
    } else input[name] = value
  }
  for (const name of ['price', 'youtube', 'facebookUrl', 'messengerUrl']) input[name] ??= ''
  return { success: true as const, input }
}
