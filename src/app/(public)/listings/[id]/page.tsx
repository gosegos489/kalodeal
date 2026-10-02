import { List, MessageCircle, ShieldCheck } from 'lucide-react'
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
import { getListing } from '@/entities/listing/get-listing'
import { ListingGallery } from '@/entities/listing/ui/listing-gallery'
import { RevealListingPhoneButton } from '@/features/reveal-listing-phone/reveal-listing-phone-button'
import { dayjs } from '@/lib/dayjs'
import { buildMetadata } from '@/lib/metadata'
import { BreadCrumbs } from '@/shared/ui/BreadCrumbs'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const listing = await getListing(id)
  if (!listing) notFound()

  if (listing.status !== 'ACTIVE') {
    return {
      title: 'Private listing',
      description: 'This listing is available to its owner only.',
      robots: { index: false, follow: false },
      openGraph: null,
      twitter: null
    }
  }

  const metadata = buildMetadata({
    title: listing.title,
    description: listing.description.replace(/\s+/g, ' ').trim().slice(0, 160),
    path: `/listings/${listing.id}`,
    image: listing.coverUrl ?? '/og_image.png'
  })

  return {
    ...metadata,
    ...(listing.coverUrl && {
      openGraph: { ...metadata.openGraph, images: [{ url: listing.coverUrl, alt: listing.title }] }
    })
  }
}

async function ListingDetails({ params }: Props) {
  const { id } = await params
  const listing = await getListing(id)
  if (!listing) notFound()

  const sellerName = listing.seller.name.trim() || 'Seller'
  const initials = sellerName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
  const publishedAt = dayjs.utc(listing.createdAt).format('D MMM YYYY')

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <BreadCrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: listing.category.name, href: `/?category=${encodeURIComponent(listing.category.slug)}#listings` },
          { label: listing.title }
        ]}
      />
      <article className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
        <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-6">
          <ListingGallery key={listing.id} title={listing.title} images={listing.images} />
          <Card className="order-3 lg:order-none">
            <CardHeader>
              <CardTitle>
                <h2>Description</h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm leading-relaxed wrap-break-word whitespace-pre-wrap">{listing.description}</p>
            </CardContent>
          </Card>
          <Card className="order-4 lg:order-none">
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
        <aside aria-label="Listing and seller information" className="order-2 flex min-w-0 flex-col gap-5 lg:sticky lg:top-24 lg:order-none">
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-muted-foreground text-xs">{listing.category.name}</p>
                <Badge variant={listing.status === 'ACTIVE' ? 'default' : 'secondary'} className="capitalize">
                  {listing.status.toLowerCase()}
                </Badge>
              </div>
              <p className="text-primary text-3xl font-semibold">{listing.price === null ? 'Price on request' : `$${listing.price}`}</p>
              <h1 className="text-2xl font-semibold wrap-break-word">{listing.title}</h1>
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
                      render={<Image src={listing.seller.image} alt="" width={56} height={56} sizes="56px" />}
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
              {listing.isOwner ? (
                <div className="flex flex-col gap-2">
                  <p className="text-muted-foreground text-xs">This is your listing.</p>
                  <Button nativeButton={false} size="lg" className="w-full" render={<Link href="/account/listings" />}>
                    <List aria-hidden="true" /> My listings
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button
                    nativeButton={false}
                    size="lg"
                    className="w-full"
                    aria-describedby="chat-help"
                    render={<Link href={listing.isAuthenticated ? '/messages' : '/login'} />}
                  >
                    <MessageCircle aria-hidden="true" /> Message seller
                  </Button>
                  <p id="chat-help" className="text-muted-foreground text-xs">
                    Private messaging is coming soon. Contact the seller by phone.
                  </p>
                </div>
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
