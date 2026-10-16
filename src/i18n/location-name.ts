import { type ListingLocation, getDistrict } from '@/entities/location/catalog'

export function localizedLocation({ district, area }: ListingLocation, names: Record<string, string>) {
  const selected = getDistrict(district)
  if (!selected) return null
  const name = names[selected.slug] ?? selected.name
  const selectedArea = selected.areas.find(([slug]) => slug === area)
  return selectedArea ? `${selectedArea[1]}, ${name}` : name
}
