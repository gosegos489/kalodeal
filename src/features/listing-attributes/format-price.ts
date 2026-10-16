import { formatListingPrice } from '@/entities/listing/format-price'
import type { ListingCurrency, ListingPricePeriod } from '@/generated/prisma/enums'
import { getCategoryAttributeProfile } from './rules'

const periodLabels = { DAY: 'day', WEEK: 'week', MONTH: 'month', YEAR: 'year' } satisfies Record<ListingPricePeriod, string>

// Legacy rent must disclose its unknown period instead of assuming monthly.
export function formatAttributeListingPrice(
  price: number | null,
  currency: ListingCurrency,
  categorySlug: string,
  attributes: { pricePeriod: ListingPricePeriod | null; priceNegotiable: boolean }
) {
  let label = formatListingPrice(price, currency)
  const profile = getCategoryAttributeProfile(categorySlug)
  if (price !== null && profile.kind === 'property' && profile.transaction === 'rent') {
    label += attributes.pricePeriod ? ` / ${periodLabels[attributes.pricePeriod]}` : ' (rental period not specified)'
  }
  if (attributes.priceNegotiable) label += ' · Negotiable'
  return label
}
