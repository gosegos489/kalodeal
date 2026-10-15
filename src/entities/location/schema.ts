import { z } from 'zod'
import { getDistrict, isAreaInDistrict } from './catalog'

export const districtSchema = z
  .string()
  .min(1, 'Choose a district.')
  .max(40)
  .refine((value) => !!getDistrict(value), 'Choose an available district.')
export const areaSchema = z.string().min(1, 'Choose an area.').max(80)

export function matchesLocation({ district, area }: { district?: string; area?: string }) {
  return !area || isAreaInDistrict(district, area)
}

export const locationPairError = { path: ['area'], message: 'Choose an area within the selected district.' }

export const listingLocationSchema = z.object({ district: districtSchema, area: areaSchema }).refine(matchesLocation, locationPairError)
