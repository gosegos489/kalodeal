import 'server-only'
import type { ListingDetails } from '@/entities/listing/types'
import { getCanonicalUrl, getCategoryPath, seoConfig, toPlainText } from './metadata'

export type JsonLd = Record<string, unknown>
export type SeoBreadcrumb = { label: string; href: string }

export function getCategoryBreadcrumbs(category: { name: string; slug: string }, ancestors: { name: string; slug: string }[] = []): SeoBreadcrumb[] {
  return [
    { label: 'Home', href: '/' },
    { label: 'Categories', href: '/categories' },
    ...[...ancestors, category].map(({ name, slug }) => ({ label: name, href: getCategoryPath(slug) }))
  ]
}

export function serializeJsonLd(data: JsonLd) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

export function buildWebsiteJsonLd(): JsonLd {
  const url = getCanonicalUrl()
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${url}#organization`,
        name: seoConfig.siteName,
        url,
        logo: getCanonicalUrl('/web-app-manifest-512x512.png')
      },
      {
        '@type': 'WebSite',
        '@id': `${url}#website`,
        name: seoConfig.siteName,
        url,
        description: seoConfig.description,
        publisher: { '@id': `${url}#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${url}?q={search_term_string}` },
          'query-input': 'required name=search_term_string'
        }
      }
    ]
  }
}

export function buildBreadcrumbJsonLd(items: SeoBreadcrumb[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(({ label, href }, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: toPlainText(label),
      item: getCanonicalUrl(href)
    }))
  }
}

export function buildCollectionJsonLd({
  title,
  description,
  path,
  breadcrumbs
}: {
  title: string
  description: string
  path: string
  breadcrumbs: SeoBreadcrumb[]
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        url: getCanonicalUrl(path),
        name: toPlainText(title),
        description: toPlainText(description),
        isPartOf: { '@id': `${getCanonicalUrl()}#website` }
      },
      buildBreadcrumbJsonLd(breadcrumbs)
    ]
  }
}

export function buildListingJsonLd(
  listing: Pick<ListingDetails, 'id' | 'title' | 'description' | 'price' | 'currency' | 'images' | 'status'>,
  breadcrumbs: SeoBreadcrumb[],
  { includeOffer = false }: { includeOffer?: boolean } = {}
): JsonLd | null {
  if (listing.status !== 'ACTIVE') return null

  const url = getCanonicalUrl(`/listings/${listing.id}`)
  const name = toPlainText(listing.title)
  const description = toPlainText(listing.description)
  const images = listing.images.map(({ url }) => url)

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        url,
        name,
        description,
        ...(images.length && { image: images }),
        isPartOf: { '@id': `${getCanonicalUrl()}#website` },
        // A price supports an Offer; the data does not establish a Product, stock, or reviews.
        ...(includeOffer &&
          listing.price !== null && {
            mainEntity: {
              '@type': 'Offer',
              url,
              name,
              description,
              ...(images.length && { image: images }),
              price: listing.price,
              priceCurrency: listing.currency
            }
          })
      },
      buildBreadcrumbJsonLd(breadcrumbs)
    ]
  }
}
