import { getTranslations } from 'next-intl/server'
import 'server-only'
import type { FavoriteLabels } from '@/features/favorites/favorite-button'

export async function getFavoriteLabels(): Promise<FavoriteLabels> {
  const t = await getTranslations('Listing')
  return {
    add: t('addFavorite'),
    remove: t('removeFavorite'),
    signIn: t('signInFavorite'),
    removing: t('removing'),
    removeButton: t('remove'),
    error: t('favoriteError'),
    connection: t('connectionError'),
    errors: {
      'Invalid favorite request.': t('errors.favoriteInvalid'),
      'Moderator accounts cannot use marketplace actions.': t('errors.marketplaceOnly'),
      'This listing is no longer available.': t('errors.unavailable'),
      'Could not update your favorites. Please try again.': t('errors.favoriteFailed')
    }
  }
}
