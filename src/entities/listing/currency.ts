import { ListingCurrency } from '@/generated/prisma/enums'

export const LISTING_CURRENCIES = Object.values(ListingCurrency)
export const DEFAULT_LISTING_CURRENCY = ListingCurrency.EUR
