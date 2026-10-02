import { Heart } from 'lucide-react'
import { AccountPlaceholder } from '@/features/account/account-placeholder'

export default function FavoritesPage() {
  return (
    <AccountPlaceholder
      title="Favorites"
      description="Save listings you like and return to them here. Favorites are not available yet."
      icon={Heart}
    />
  )
}
