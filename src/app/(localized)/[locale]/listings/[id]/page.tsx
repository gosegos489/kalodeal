import { List, ShieldCheck } from 'lucide-react'
import type { Metadata } from 'next'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getPublicCategory } from '@/entities/category/get-category-tree'
import { getListingChatLabel } from '@/entities/listing/contact-links'
import { getListing } from '@/entities/listing/get-listing'
import { ListingAttributeDetails } from '@/entities/listing/ui/listing-attributes'
import { ListingGallery } from '@/entities/listing/ui/listing-gallery'
import { ListingDetailSkeleton } from '@/entities/listing/ui/listing-skeleton'
import { getSellerInitials } from '@/entities/user/public-profile'
import { FavoriteButton } from '@/features/favorites/favorite-button'
import { formatAttributeListingPrice } from '@/features/listing-attributes/format-price'
import { ListingViewTracker } from '@/features/listing-views/listing-view-tracker'
import { MessageSellerButton } from '@/features/messages/message-seller-button'
import { RevealListingPhoneButton } from '@/features/reveal-listing-phone/reveal-listing-phone-button'
import { categoryName } from '@/i18n/category-name'
import { getFavoriteLabels } from '@/i18n/listing-labels'
import { localizedLocation } from '@/i18n/location-name'
import { Link } from '@/i18n/navigation'
import { localizeHref } from '@/i18n/routing'
import { buildListingJsonLd, getCategoryBreadcrumbs } from '@/lib/json-ld'
import { buildListingMetadata, getCategoryPath } from '@/lib/metadata'
import { BreadCrumbs } from '@/shared/ui/BreadCrumbs'
import { JsonLd } from '@/shared/ui/json-ld'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const listing = await getListing(id)
  if (!listing) notFound()
  return buildListingMetadata(listing, await getLocale())
}

async function ListingDetails({ params }: Props) {
  const locale = await getLocale()
  const messages = await getMessages({ locale })
  const t = await getTranslations({ locale, namespace: 'Listing' })
  const nav = await getTranslations({ locale, namespace: 'Categories' })
  const favoriteLabels = await getFavoriteLabels()
  const { id } = await params
  const listing = await getListing(id)
  if (!listing) notFound()

  const category = listing.publiclyVisible ? await getPublicCategory(listing.category.slug) : null
  const breadcrumbs = [
    ...(category
      ? getCategoryBreadcrumbs(category.category, category.ancestors, locale, messages.CategoryNames)
      : [{ label: nav('home'), href: localizeHref('/', locale) }]),
    { label: listing.title, href: localizeHref(`/listings/${listing.id}`, locale) }
  ]
  const isJobListing = category && [...category.ancestors, category.category].some(({ slug }) => slug === 'jobs')

  const sellerName = listing.seller.hasName ? listing.seller.name : t('seller')
  const initials = getSellerInitials(sellerName)
  const publishedAt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Nicosia' }).format(
    listing.createdAt
  )

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {listing.isOwner && listing.status === 'ACTIVE' && !listing.publiclyVisible && (
        <p role="status" className="text-muted-foreground text-sm">
          This listing exceeds your current plan allowance and is visible only to you. Hide other listings or upgrade your plan to make it public.
        </p>
      )}
      <JsonLd data={buildListingJsonLd(listing, breadcrumbs, { includeOffer: Boolean(category) && !isJobListing, locale })} />
      {listing.publiclyVisible && !listing.isOwner && <ListingViewTracker listingId={listing.id} />}
      <BreadCrumbs
        items={[
          { label: nav('home'), href: localizeHref('/', locale) },
          {
            label: categoryName(listing.category, messages.CategoryNames),
            href: localizeHref(`${getCategoryPath(listing.category.slug)}#listings`, locale)
          },
          { label: listing.title }
        ]}
      />
      <Link href="/" className="text-primary text-sm underline underline-offset-4">
        {t('back')}
      </Link>
      <article className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
        <aside
          aria-label={t('sellerInfo')}
          className="order-2 flex min-w-0 flex-col gap-5 lg:sticky lg:top-24 lg:order-0 lg:col-start-2 lg:row-start-1"
        >
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-muted-foreground text-xs">{categoryName(listing.category, messages.CategoryNames)}</p>
                <Badge variant={listing.publiclyVisible ? 'default' : 'secondary'} className="capitalize">
                  {t(listing.status)}
                </Badge>
              </div>
              <p className="text-primary text-3xl font-semibold">
                {formatAttributeListingPrice(listing.price, listing.currency, listing.category.slug, listing, { locale, labels: messages.Listing })}
              </p>
              <h1 className="text-2xl font-semibold wrap-break-word">{listing.title}</h1>
              <div className="flex items-center gap-3">
                {listing.canUseMarketplace && listing.publiclyVisible && (
                  <FavoriteButton
                    loginHref={localizeHref('/login', locale)}
                    labels={favoriteLabels}
                    listingId={listing.id}
                    title={listing.title}
                    isFavorited={listing.isFavorited}
                    isAuthenticated={listing.isAuthenticated}
                  />
                )}
                <p role="status" className="text-muted-foreground text-sm">
                  {t('favorites', { count: listing.favoritesCount })}
                </p>
              </div>
              <p className="text-muted-foreground text-xs">
                {t('published')} <time dateTime={listing.createdAt.toISOString()}>{publishedAt}</time>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                <h2>{t('seller')}</h2>
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
                <Link href={`/sellers/${encodeURIComponent(listing.seller.id)}`} className="hover:text-primary min-w-0 font-medium wrap-break-word">
                  {sellerName}
                </Link>
              </div>
              <div className="text-muted-foreground space-y-1 text-sm">
                <p>
                  {t('postingSince', {
                    date: new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'Asia/Nicosia' }).format(
                      listing.seller.createdAt
                    )
                  })}
                </p>
                <p>{t('activeAds', { count: listing.seller.activeAds })}</p>
              </div>
              <Link href={`/sellers/${encodeURIComponent(listing.seller.id)}`} className="text-primary text-sm underline underline-offset-4">
                {t('otherAds')}
              </Link>
              {listing.maskedPhone && (
                <RevealListingPhoneButton
                  loginHref={localizeHref('/login', locale)}
                  labels={{
                    reveal: t('reveal'),
                    revealing: t('revealing'),
                    revealLabel: t('revealLabel', { phone: listing.maskedPhone }),
                    signIn: t('signInPhone', { phone: listing.maskedPhone }),
                    error: t('phoneError'),
                    connection: t('connectionError')
                  }}
                  key={listing.id}
                  listingId={listing.id}
                  maskedPhone={listing.maskedPhone}
                  isAuthenticated={listing.isAuthenticated}
                />
              )}
              {(listing.facebookUrl || listing.messengerUrl) && (
                <div aria-label={t('sellerContacts')} className="flex flex-wrap gap-2">
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
                      {getListingChatLabel(listing.messengerUrl)}
                    </Button>
                  )}
                </div>
              )}
              {!listing.canUseMarketplace ? (
                <Button nativeButton={false} size="lg" className="w-full" render={<Link href={`/moderator/listings/${listing.id}`} />}>
                  {t('reviewListing')}
                </Button>
              ) : listing.isOwner ? (
                <div className="flex flex-col gap-2">
                  <p className="text-muted-foreground text-xs">{t('ownListing')}</p>
                  <Button nativeButton={false} size="lg" className="w-full" render={<Link href="/account/listings" />}>
                    <List aria-hidden="true" /> {t('myListings')}
                  </Button>
                </div>
              ) : (
                <MessageSellerButton
                  locale={locale}
                  loginHref={localizeHref('/login', locale)}
                  labels={{ message: t('messageSeller'), opening: t('opening'), error: t('conversationError'), retry: t('conversationRetry') }}
                  listingId={listing.id}
                  isAuthenticated={listing.isAuthenticated}
                />
              )}
            </CardContent>
          </Card>
          <div className="text-muted-foreground flex items-start gap-3 rounded-xl border border-dashed p-4 text-xs leading-relaxed">
            <ShieldCheck aria-hidden="true" className="text-primary mt-0.5 size-5 shrink-0" />
            <p>
              {t('safety')}{' '}
              <Link href="/safety" className="text-primary underline underline-offset-4">
                {t('safetyTips')}
              </Link>
              .
            </p>
          </div>
        </aside>
        <div className="contents lg:col-start-1 lg:row-start-1 lg:flex lg:min-w-0 lg:flex-col lg:gap-6">
          <ListingGallery
            labels={{
              choose: t('choosePhoto'),
              status: listing.images.map((_, index) => t('photoCount', { number: index + 1, count: listing.images.length })),
              noPhotos: t('noPhotos'),
              photos: t('photos', { title: listing.title }),
              photo: t('photo'),
              previous: t('previousPhoto'),
              next: t('nextPhoto'),
              show: listing.images.map((_, index) => t('showPhoto', { number: index + 1 })),
              alts: listing.images.map((_, index) => t('photoAlt', { title: listing.title, number: index + 1 }))
            }}
            key={listing.id}
            title={listing.title}
            images={listing.images}
          />
          <ListingAttributeDetails categorySlug={listing.category.slug} attributes={listing} />
          <Card className="order-3 lg:order-0">
            <CardHeader>
              <CardTitle>
                <h2>{t('description')}</h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm leading-relaxed wrap-break-word whitespace-pre-wrap">{listing.description}</p>
            </CardContent>
          </Card>
          <Card className="order-4 lg:order-0">
            <CardHeader>
              <CardTitle>
                <h2>{t('details')}</h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div className="space-y-1">
                  <dt className="text-muted-foreground">{t('category')}</dt>
                  <dd>{categoryName(listing.category, messages.CategoryNames)}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-muted-foreground">{t('status')}</dt>
                  <dd>{t(listing.status)}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-muted-foreground">{t('location')}</dt>
                  <dd>{localizedLocation(listing, messages.Locations) ?? t('notSpecified')}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-muted-foreground">{t('published')}</dt>
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
      <Suspense fallback={<ListingDetailSkeleton />}>
        <ListingDetails params={params} />
      </Suspense>
    </div>
  )
}
