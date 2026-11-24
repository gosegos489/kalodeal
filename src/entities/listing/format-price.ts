import type { ListingCurrency } from '@/generated/prisma/enums'
import { getDisplayFormatter } from '@/i18n/formatter'

export function formatListingPrice(price: number | null, currency: ListingCurrency, locale = 'en', onRequest = 'Price on request') {
  if (price === null) return onRequest

  // Listing Decimal values are already in major units, unlike Stripe receipts.
  return getDisplayFormatter(locale).number(price, 'listingPrice', { currency })
}
