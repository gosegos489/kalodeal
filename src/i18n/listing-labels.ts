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
    connection: t('connectionError')
  }
}
