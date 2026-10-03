import type { ListingCurrency } from '@/generated/prisma/enums'

export function formatListingPrice(price: number | null, currency: ListingCurrency) {
  if (price === null) return 'Price on request'

  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(price)
}
