import { Building2, Clock, ExternalLink, MapPin } from 'lucide-react'
import type { Metadata } from 'next'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ListingCard } from '@/entities/listing/ui/listing-card'
import { getPublicSeller } from '@/entities/user/get-public-seller'
import { getSellerListings } from '@/entities/user/get-seller-listings'
import { getSellerInitials } from '@/entities/user/public-profile'
import { SellerProfileSkeleton } from '@/entities/user/seller-profile-skeleton'
import { categoryName } from '@/i18n/category-name'
import { Link } from '@/i18n/navigation'
import { localizeHref } from '@/i18n/routing'
import { buildMetadata } from '@/lib/metadata'
import { cn } from '@/lib/utils'
import { BreadCrumbs } from '@/shared/ui/BreadCrumbs'
import NuqsPagination from '@/shared/ui/NuqsPagination'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ category?: string | string[]; page?: string | string[] }>
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ id }, filters] = await Promise.all([params, searchParams])
  const seller = await getPublicSeller(id)
  if (!seller) notFound()
  const t = await getTranslations('Sellers')
  const sellerName = seller.hasName ? seller.name : t('sellerName')
  return buildMetadata({
    title: t('title', { name: sellerName }),
    description: seller.details?.description || t('description', { name: sellerName }),
    path: `/sellers/${encodeURIComponent(seller.id)}`,
    locale: await getLocale(),
    localized: !filters.category && !filters.page,
    robots: filters.category || filters.page ? { index: false, follow: true } : { index: true, follow: true }
  })
}

async function SellerProfile({ params, searchParams }: Props) {
  const [{ id }, filters] = await Promise.all([params, searchParams])
  const seller = await getPublicSeller(id)
  if (!seller) notFound()
  const result = await getSellerListings(seller.id, filters)
  const locale = await getLocale()
  const t = await getTranslations('Sellers')
  const sellerName = seller.hasName ? seller.name : t('sellerName')
  const messages = await getMessages()
  const search = messages.Search
  const categories = result.categories.map((category) => {
    const ancestors: string[] = [categoryName(category, messages.CategoryNames)]
    const visited = new Set([category.id])
    let parent = category.parentId
    while (parent && !visited.has(parent)) {
      visited.add(parent)
      const ancestor = result.categories.find((item) => item.id === parent)
      if (!ancestor) break
      ancestors.unshift(categoryName(ancestor, messages.CategoryNames))
      parent = ancestor.parentId
    }
    return { ...category, name: categoryName(category, messages.CategoryNames), label: ancestors.join(' / ') }
  })
  const base = `/sellers/${encodeURIComponent(seller.id)}`
  const business = seller.accountType === 'BUSINESS'
  const details = seller.details

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <BreadCrumbs items={[{ label: t('home'), href: localizeHref('/', locale) }, { label: sellerName }]} />
      <Card className="overflow-hidden">
        {business && <div className="from-primary/15 to-primary/5 h-16 bg-linear-to-r sm:h-24" />}
        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <Avatar className={cn('ring-background size-20 shrink-0 ring-4 sm:size-24', business && '-mt-16 rounded-2xl sm:-mt-20')}>
              {seller.image && (
                <AvatarImage src={seller.image} alt="" render={<Image src={seller.image} alt="" width={96} height={96} sizes="96px" unoptimized />} />
              )}
              <AvatarFallback className={cn('text-2xl', business && 'rounded-2xl')}>
                {business ? <Building2 aria-hidden="true" className="size-9" /> : getSellerInitials(sellerName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-2">
              {business && <Badge variant="secondary">{t('business')}</Badge>}
              <h1 className="text-2xl font-semibold wrap-anywhere sm:text-3xl">{sellerName}</h1>
              <div className="text-muted-foreground flex flex-wrap gap-x-5 gap-y-1 text-sm">
                <p>
                  {t('postingSince', {
                    date: new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(seller.createdAt)
                  })}
                </p>
                <p>{t('activeAds', { count: result.total })}</p>
              </div>
            </div>
          </div>
          {details && Object.values(details).some(Boolean) && (
            <div className="space-y-5 border-t pt-6">
              <dl className="grid gap-5 text-sm sm:grid-cols-2 lg:grid-cols-3">
                {details.address && (
                  <div>
                    <dt className="text-muted-foreground mb-1 flex items-center gap-2">
                      <MapPin aria-hidden="true" className="size-4" />
                      {t('address')}
                    </dt>
                    <dd className="wrap-anywhere whitespace-pre-wrap">{details.address}</dd>
                  </div>
                )}
                {details.website && (
                  <div>
                    <dt className="text-muted-foreground mb-1 flex items-center gap-2">
                      <ExternalLink aria-hidden="true" className="size-4" />
                      {t('website')}
                    </dt>
                    <dd>
                      <a
                        href={details.website}
                        target="_blank"
                        rel="noopener noreferrer nofollow ugc"
                        className="text-primary wrap-anywhere underline underline-offset-4"
                      >
                        {details.website}
                      </a>
                    </dd>
                  </div>
                )}
                {details.openingHours && (
                  <div>
                    <dt className="text-muted-foreground mb-1 flex items-center gap-2">
                      <Clock aria-hidden="true" className="size-4" />
                      {t('hours')}
                    </dt>
                    <dd className="wrap-anywhere whitespace-pre-wrap">{details.openingHours}</dd>
                  </div>
                )}
              </dl>
              {details.description && <p className="max-w-4xl text-sm leading-relaxed wrap-anywhere whitespace-pre-wrap">{details.description}</p>}
            </div>
          )}
        </CardContent>
      </Card>
      <section id="ads" aria-labelledby="seller-ads-heading" className="grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav aria-label={t('filter')} className="rounded-xl border p-4 lg:sticky lg:top-24">
          <p className="mb-3 text-sm font-semibold">{t('categories')}</p>
          <ul className="flex flex-wrap gap-1 lg:flex-col">
            {[{ slug: '', label: t('all'), count: result.total }, ...categories].map((category) => (
              <li key={category.slug} className="min-w-0">
                <Link
                  prefetch={false}
                  href={category.slug ? `${base}?category=${encodeURIComponent(category.slug)}#ads` : `${base}#ads`}
                  aria-current={result.category === category.slug ? 'page' : undefined}
                  className={cn(
                    'hover:bg-muted flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm',
                    result.category === category.slug && 'bg-primary/10 text-primary font-medium'
                  )}
                >
                  <span className="wrap-anywhere">{category.label}</span>
                  <span className="text-muted-foreground shrink-0 tabular-nums">{category.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0 space-y-6">
          <h2 id="seller-ads-heading" className="text-xl font-semibold">
            {result.category ? (categories.find((category) => category.slug === result.category)?.name ?? t('category')) : t('all')}{' '}
            <span className="text-muted-foreground">({result.pagination.totalItems})</span>
          </h2>
          {result.listings.length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {result.listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isAuthenticated={false}
                  isFavorited={false}
                  showFavorite={false}
                  prefetch={false}
                  imageSizes="(max-width: 639px) calc(100vw - 32px), (max-width: 1023px) calc((100vw - 52px) / 2), (max-width: 1279px) calc((100vw - 330px) / 2), 290px"
                />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground rounded-xl border border-dashed p-8">{t('empty')}</p>
          )}
          <NuqsPagination
            totalPages={result.pagination.totalPages}
            ariaLabel={t('pages')}
            labels={{
              previous: search.previous,
              next: search.next,
              loading: search.loadingResults,
              pageOf: search.pageOf,
              goToPage: search.goToPage,
              error: search.pageError,
              retry: search.retry
            }}
          />
        </div>
      </section>
    </div>
  )
}

export default function SellerPage(props: Props) {
  return (
    <div className="container max-w-7xl py-8 sm:py-10">
      <Suspense fallback={<SellerProfileSkeleton />}>
        <SellerProfile {...props} />
      </Suspense>
    </div>
  )
}
