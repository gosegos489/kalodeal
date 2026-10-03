import { List, ShieldCheck } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getPublicCategory } from '@/entities/category/get-category-tree'
import { formatListingPrice } from '@/entities/listing/format-price'
import { getListing } from '@/entities/listing/get-listing'
import { ListingGallery } from '@/entities/listing/ui/listing-gallery'
import { getSellerInitials } from '@/entities/user/public-profile'
import { FavoriteButton } from '@/features/favorites/favorite-button'
import { ListingViewTracker } from '@/features/listing-views/listing-view-tracker'
import { MessageSellerButton } from '@/features/messages/message-seller-button'
import { RevealListingPhoneButton } from '@/features/reveal-listing-phone/reveal-listing-phone-button'
import { dayjs } from '@/lib/dayjs'
import { buildListingJsonLd, getCategoryBreadcrumbs } from '@/lib/json-ld'
import { buildListingMetadata, getCategoryPath } from '@/lib/metadata'
import { BreadCrumbs } from '@/shared/ui/BreadCrumbs'
import { JsonLd } from '@/shared/ui/json-ld'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const listing = await getListing(id)
  if (!listing) notFound()
  return buildListingMetadata(listing)
}

async function ListingDetails({ params }: Props) {
  const { id } = await params
  const listing = await getListing(id)
  if (!listing) notFound()

  const category = listing.status === 'ACTIVE' ? await getPublicCategory(listing.category.slug) : null
  const breadcrumbs = [
    ...(category ? getCategoryBreadcrumbs(category.category, category.ancestors) : [{ label: 'Home', href: '/' }]),
    { label: listing.title, href: `/listings/${listing.id}` }
  ]
  const isJobListing = category && [...category.ancestors, category.category].some(({ slug }) => slug === 'jobs')

  const sellerName = listing.seller.name
  const initials = getSellerInitials(sellerName)
  const publishedAt = dayjs.utc(listing.createdAt).format('D MMM YYYY')

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <JsonLd data={buildListingJsonLd(listing, breadcrumbs, { includeOffer: Boolean(category) && !isJobListing })} />
      {listing.status === 'ACTIVE' && !listing.isOwner && <ListingViewTracker listingId={listing.id} />}
      <BreadCrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: listing.category.name, href: `${getCategoryPath(listing.category.slug)}#listings` },
          { label: listing.title }
        ]}
      />
      <article className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
        <aside
          aria-label="Listing and seller information"
          className="order-2 flex min-w-0 flex-col gap-5 lg:sticky lg:top-24 lg:order-0 lg:col-start-2 lg:row-start-1"
        >
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-muted-foreground text-xs">{listing.category.name}</p>
                <Badge variant={listing.status === 'ACTIVE' ? 'default' : 'secondary'} className="capitalize">
                  {listing.status.toLowerCase()}
                </Badge>
              </div>
              <p className="text-primary text-3xl font-semibold">{formatListingPrice(listing.price, listing.currency)}</p>
              <h1 className="text-2xl font-semibold wrap-break-word">{listing.title}</h1>
              <div className="flex items-center gap-3">
                {listing.canUseMarketplace && listing.status === 'ACTIVE' && (
                  <FavoriteButton
                    listingId={listing.id}
                    title={listing.title}
                    isFavorited={listing.isFavorited}
                    isAuthenticated={listing.isAuthenticated}
                  />
                )}
                <p role="status" className="text-muted-foreground text-sm">
                  {listing.favoritesCount} {listing.favoritesCount === 1 ? 'favorite' : 'favorites'}
                </p>
              </div>
              <p className="text-muted-foreground text-xs">
                Published <time dateTime={listing.createdAt.toISOString()}>{publishedAt}</time>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                <h2>Seller</h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <Avatar className="size-14">
                  {listing.seller.image && (
                    <AvatarImage
                      src={listing.seller.image}
                      alt=""
                      render={<Image src={listing.seller.image} alt="" width={56} height={56} sizes="56px" unoptimized />}
                    />
                  )}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <p className="min-w-0 font-medium wrap-break-word">{sellerName}</p>
              </div>
              {listing.maskedPhone && (
                <RevealListingPhoneButton
                  key={listing.id}
                  listingId={listing.id}
                  maskedPhone={listing.maskedPhone}
                  isAuthenticated={listing.isAuthenticated}
                />
              )}
              {(listing.facebookUrl || listing.messengerUrl) && (
                <div aria-label="Seller contacts" className="flex flex-wrap gap-2">
                  {listing.facebookUrl && (
                    <Button
                      nativeButton={false}
                      variant="outline"
                      render={<a href={listing.facebookUrl} target="_blank" rel="noopener noreferrer" />}
                    >
                      Facebook
                    </Button>
                  )}
                  {listing.messengerUrl && (
                    <Button
                      nativeButton={false}
                      variant="outline"
                      render={<a href={listing.messengerUrl} target="_blank" rel="noopener noreferrer" />}
                    >
                      Messenger
                    </Button>
                  )}
                </div>
              )}
              {!listing.canUseMarketplace ? (
                <Button nativeButton={false} size="lg" className="w-full" render={<Link href={`/moderator/listings/${listing.id}`} />}>
                  Review listing
                </Button>
              ) : listing.isOwner ? (
                <div className="flex flex-col gap-2">
                  <p className="text-muted-foreground text-xs">This is your listing.</p>
                  <Button nativeButton={false} size="lg" className="w-full" render={<Link href="/account/listings" />}>
                    <List aria-hidden="true" /> My listings
                  </Button>
                </div>
              ) : (
                <MessageSellerButton listingId={listing.id} isAuthenticated={listing.isAuthenticated} />
              )}
            </CardContent>
          </Card>
          <div className="text-muted-foreground flex items-start gap-3 rounded-xl border border-dashed p-4 text-xs leading-relaxed">
            <ShieldCheck aria-hidden="true" className="text-primary mt-0.5 size-5 shrink-0" />
            <p>
              Meet safely and check the item before paying.{' '}
              <Link href="/safety" className="text-primary underline underline-offset-4">
                Read our safety tips
              </Link>
              .
            </p>
          </div>
        </aside>
        <div className="contents lg:col-start-1 lg:row-start-1 lg:flex lg:min-w-0 lg:flex-col lg:gap-6">
          <ListingGallery key={listing.id} title={listing.title} images={listing.images} />
          <Card className="order-3 lg:order-0">
            <CardHeader>
              <CardTitle>
                <h2>Description</h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm leading-relaxed wrap-break-word whitespace-pre-wrap">{listing.description}</p>
            </CardContent>
          </Card>
          <Card className="order-4 lg:order-0">
            <CardHeader>
              <CardTitle>
                <h2>Listing details</h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div className="space-y-1">
                  <dt className="text-muted-foreground">Category</dt>
                  <dd>{listing.category.name}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="capitalize">{listing.status.toLowerCase()}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-muted-foreground">Published</dt>
                  <dd>
                    <time dateTime={listing.createdAt.toISOString()}>{publishedAt}</time>
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </article>
    </div>
  )
}

export default function ListingPage({ params }: Props) {
  return (
    <div className="container max-w-7xl py-8 sm:py-10">
      <Suspense
        fallback={
          <div role="status" aria-label="Loading listing" className="flex flex-col gap-6">
            <Skeleton className="h-5 w-64" />
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-6">
                <Skeleton className="aspect-4/3 rounded-2xl" />
                <Skeleton className="h-40 rounded-xl" />
              </div>
              <div className="space-y-5">
                <Skeleton className="h-56 rounded-xl" />
                <Skeleton className="h-64 rounded-xl" />
              </div>
            </div>
            <span className="sr-only">Loading listing...</span>
          </div>
        }
      >
        <ListingDetails params={params} />
      </Suspense>
    </div>
  )
}
