import { ArrowRight, Heart } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { ListingRow } from '@/entities/listing/ui/listing-row'
import { ListingRowsSkeleton } from '@/entities/listing/ui/listing-skeleton'
import { ListingStatusBadge } from '@/features/account/listing-status-badge'
import { getMyFavorites } from '@/features/favorites/data'
import { FavoriteButton } from '@/features/favorites/favorite-button'
import { categoryName } from '@/i18n/category-name'
import { getFavoriteLabels } from '@/i18n/listing-labels'
import { Link } from '@/i18n/navigation'
import { localizeHref } from '@/i18n/routing'
import { serializePagination } from '@/lib/pagination'
import NuqsPagination from '@/shared/ui/workspace-pagination'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

const favoritesRowsClassName = 'flex min-w-0 flex-col gap-4'

async function FavoriteListings({ searchParams }: Props) {
  const locale = await getLocale()

  const t = await getTranslations('Workspace')
  const messages = await getMessages()
  const favoriteLabels = await getFavoriteLabels()

  const params = await searchParams
  const { listings, page, pageSize, totalItems, totalPages } = await getMyFavorites(params.page)

  // Normalize invalid/out-of-range URLs, also after removing the final card on a page.
  if (params.page !== undefined && params.page !== String(page)) {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (key === 'page' || value === undefined) continue
      for (const item of Array.isArray(value) ? value : [value]) query.append(key, item)
    }
    redirect(localizeHref(`/account/favorites${serializePagination(query, { page })}`, locale))
  }

  if (!listings.length) {
    return (
      <div className="bg-card flex flex-col items-center gap-4 rounded-2xl border border-dashed px-6 py-12 text-center">
        <Heart aria-hidden="true" className="text-muted-foreground size-8" strokeWidth={1.5} />
        <h3 className="text-lg font-semibold">{t('youDonTHaveAnyFavoriteListingsYet')}</h3>
        <p className="text-muted-foreground max-w-sm text-sm">{t('saveListingsYouLikeAndReturnToThemHere')}</p>
        <Button nativeButton={false} render={<Link href="/#listings" />}>
          {t('browseListings')} <ArrowRight aria-hidden="true" />
        </Button>
      </div>
    )
  }

  return (
    <>
      <p role="status" className="text-muted-foreground text-sm">
        {t('showing')} {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} {t('of')} {totalItems} {t('favorites')}
      </p>
      <div className={favoritesRowsClassName}>
        {listings.map((listing) => (
          <ListingRow
            key={listing.id}
            listing={listing}
            href={listing.status === 'ACTIVE' ? `/listings/${listing.id}` : null}
            metadata={
              <span className="max-w-full truncate" title={categoryName(listing.category, messages.CategoryNames)}>
                {categoryName(listing.category, messages.CategoryNames)}
              </span>
            }
            status={<ListingStatusBadge status={listing.status} />}
            actions={
              <div className="flex flex-wrap justify-end">
                <FavoriteButton
                  labels={favoriteLabels}
                  loginHref={localizeHref('/login', locale)}
                  listingId={listing.id}
                  title={listing.title}
                  isFavorited
                  isAuthenticated
                  removalOnly
                />
              </div>
            }
          />
        ))}
      </div>
      <NuqsPagination totalPages={totalPages} ariaLabel={t('favoritesPages')} />
    </>
  )
}

export default function FavoritesPage({ searchParams }: Props) {
  const t = useTranslations('Workspace')

  return (
    <section aria-labelledby="favorites-heading" className="flex flex-col gap-6">
      <div>
        <h2 id="favorites-heading" className="text-2xl font-semibold">
          {t('favorites138')}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {t('yourSavedListingsWithTheMostRecentlyAddedFirstUnavailableListingsStayHereUntilYouRemo')}
        </p>
      </div>
      <Suspense fallback={<ListingRowsSkeleton label={t('loadingYourFavorites')} />}>
        <FavoriteListings searchParams={searchParams} />
      </Suspense>
    </section>
  )
}
