import type { ListingCurrency, ListingStatus } from '@/generated/prisma/enums'

export type ListingSummary = {
  id: string
  title: string
  description: string
  price: number | null
  currency: ListingCurrency
  createdAt: Date
  category: { name: string }
  coverUrl: string | null
}

export type ListingDetails = Omit<ListingSummary, 'category'> & {
  status: ListingStatus
  category: { name: string; slug: string }
  images: { id: string; url: string }[]
  seller: { name: string; image: string | null }
  maskedPhone: string | null
  facebookUrl: string | null
  messengerUrl: string | null
  isOwner: boolean
  isAuthenticated: boolean
  canUseMarketplace: boolean
  isFavorited: boolean
  favoritesCount: number
}
