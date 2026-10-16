import { formatListingPrice } from '@/entities/listing/format-price'
import type { ListingCurrency, ListingPricePeriod } from '@/generated/prisma/enums'
import { getCategoryAttributeProfile } from './rules'

const defaultLabels = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
  priceRequest: 'Price on request',
  unknownPeriod: 'rental period not specified',
  negotiable: 'Negotiable'
}
export type PriceLabels = typeof defaultLabels

// Legacy rent must disclose its unknown period instead of assuming monthly.
export function formatAttributeListingPrice(
  price: number | null,
  currency: ListingCurrency,
  categorySlug: string,
  attributes: { pricePeriod: ListingPricePeriod | null; priceNegotiable: boolean },
  { locale = 'en', labels = defaultLabels }: { locale?: string; labels?: PriceLabels } = {}
) {
  let label = formatListingPrice(price, currency, locale, labels.priceRequest)
  const profile = getCategoryAttributeProfile(categorySlug)
  if (price !== null && profile.kind === 'property' && profile.transaction === 'rent') {
    label += attributes.pricePeriod ? ` / ${labels[attributes.pricePeriod]}` : ` (${labels.unknownPeriod})`
  }
  if (attributes.priceNegotiable) label += ` · ${labels.negotiable}`
  return label
}
