import type { ListingLocation } from '@/entities/location/catalog'
import type { ListingAttributes } from '@/features/listing-attributes/schema'
import type { ListingCurrency, ListingPricePeriod, ListingStatus } from '@/generated/prisma/enums'

export type ListingSummary = ListingLocation & {
  id: string
  title: string
  description: string
  price: number | null
  currency: ListingCurrency
  pricePeriod?: ListingPricePeriod | null
  priceNegotiable?: boolean
  createdAt: Date
  category: { name: string; slug?: string }
  coverUrl: string | null
  imageUrls: string[]
}

export type ListingDetails = Omit<ListingSummary, 'category'> &
  ListingAttributes & {
    status: ListingStatus
    publiclyVisible: boolean
    category: { name: string; slug: string }
    images: { id: string; url: string }[]
    seller: { id: string; name: string; image: string | null; createdAt: Date; activeAds: number }
    maskedPhone: string | null
    facebookUrl: string | null
    messengerUrl: string | null
    isOwner: boolean
    isAuthenticated: boolean
    canUseMarketplace: boolean
    isFavorited: boolean
    favoritesCount: number
  }
