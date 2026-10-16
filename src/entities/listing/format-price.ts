import type { ListingCurrency } from '@/generated/prisma/enums'

export function formatListingPrice(price: number | null, currency: ListingCurrency, locale = 'en', onRequest = 'Price on request') {
  if (price === null) return onRequest

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(price)
}
