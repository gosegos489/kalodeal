import { Building2, Clock, ExternalLink, MapPin } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ListingCard } from '@/entities/listing/ui/listing-card'
import { getPublicSeller } from '@/entities/user/get-public-seller'
import { getSellerListings } from '@/entities/user/get-seller-listings'
import { getSellerInitials, postingSince } from '@/entities/user/public-profile'
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
  return buildMetadata({
    title: `${seller.name} — seller profile`,
    description: seller.details?.description || `Browse active ads from ${seller.name} on Kalodeal.`,
    path: `/sellers/${encodeURIComponent(seller.id)}`,
    robots: filters.category || filters.page ? { index: false, follow: true } : { index: true, follow: true }
  })
}

async function SellerProfile({ params, searchParams }: Props) {
  const [{ id }, filters] = await Promise.all([params, searchParams])
  const seller = await getPublicSeller(id)
  if (!seller) notFound()
  const result = await getSellerListings(seller.id, filters)
  const base = `/sellers/${encodeURIComponent(seller.id)}`
  const business = seller.accountType === 'BUSINESS'
  const details = seller.details

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <BreadCrumbs items={[{ label: 'Home', href: '/' }, { label: seller.name }]} />
      <Card className="overflow-hidden">
        {business && <div className="from-primary/15 to-primary/5 h-16 bg-linear-to-r sm:h-24" />}
        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <Avatar className={cn('ring-background size-20 shrink-0 ring-4 sm:size-24', business && '-mt-16 rounded-2xl sm:-mt-20')}>
              {seller.image && (
                <AvatarImage src={seller.image} alt="" render={<Image src={seller.image} alt="" width={96} height={96} sizes="96px" unoptimized />} />
              )}
              <AvatarFallback className={cn('text-2xl', business && 'rounded-2xl')}>
                {business ? <Building2 aria-hidden="true" className="size-9" /> : getSellerInitials(seller.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-2">
              {business && <Badge variant="secondary">Business Account</Badge>}
              <h1 className="text-2xl font-semibold wrap-anywhere sm:text-3xl">{seller.name}</h1>
              <div className="text-muted-foreground flex flex-wrap gap-x-5 gap-y-1 text-sm">
                <p>{postingSince(seller.createdAt)}</p>
                <p>
                  {result.total} active {result.total === 1 ? 'ad' : 'ads'}
                </p>
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
                      Business address
                    </dt>
                    <dd className="wrap-anywhere whitespace-pre-wrap">{details.address}</dd>
                  </div>
                )}
                {details.website && (
                  <div>
                    <dt className="text-muted-foreground mb-1 flex items-center gap-2">
                      <ExternalLink aria-hidden="true" className="size-4" />
                      Website
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
                      Opening hours
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
        <nav aria-label="Filter seller ads by category" className="rounded-xl border p-4 lg:sticky lg:top-24">
          <p className="mb-3 text-sm font-semibold">Categories</p>
          <ul className="flex flex-wrap gap-1 lg:flex-col">
            {[{ slug: '', label: 'All ads', count: result.total }, ...result.categories].map((category) => (
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
            {result.category ? (result.categories.find((category) => category.slug === result.category)?.name ?? 'Category') : 'All ads'}{' '}
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
            <p className="text-muted-foreground rounded-xl border border-dashed p-8">No active ads in this category.</p>
          )}
          <NuqsPagination totalPages={result.pagination.totalPages} ariaLabel="Seller listing pages" />
        </div>
      </section>
    </div>
  )
}

export default function SellerPage(props: Props) {
  return (
    <div className="container max-w-7xl py-8 sm:py-10">
      <Suspense
        fallback={
          <div role="status" aria-label="Loading seller profile" className="space-y-8">
            <Skeleton className="h-64 rounded-2xl" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((id) => (
                <Skeleton key={id} className="h-80 rounded-2xl" />
              ))}
            </div>
          </div>
        }
      >
        <SellerProfile {...props} />
      </Suspense>
    </div>
  )
}
