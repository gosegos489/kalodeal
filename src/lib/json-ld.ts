import 'server-only'
import type { ListingDetails } from '@/entities/listing/types'
import { categoryName } from '@/i18n/category-name'
import el from '@/i18n/messages/el.json'
import en from '@/i18n/messages/en.json'
import { type Locale, localizeHref } from '@/i18n/routing'
import { getCanonicalUrl, getCategoryPath, seoConfig, toPlainText } from './metadata'

export type JsonLd = Record<string, unknown>
export type SeoBreadcrumb = { label: string; href: string }

export function getCategoryBreadcrumbs(
  category: { name: string; slug: string },
  ancestors: { name: string; slug: string }[] = [],
  locale: Locale = 'en',
  names: Record<string, string> = en.CategoryNames
): SeoBreadcrumb[] {
  return [
    { label: { en, el }[locale].Categories.home, href: localizeHref('/', locale) },
    { label: { en, el }[locale].Categories.categories, href: localizeHref('/categories', locale) },
    ...[...ancestors, category].map((category) => ({
      label: categoryName(category, names),
      href: localizeHref(getCategoryPath(category.slug), locale)
    }))
  ]
}

export function serializeJsonLd(data: JsonLd) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

export function buildWebsiteJsonLd(locale: Locale = 'en', description: string = seoConfig.description): JsonLd {
  const url = getCanonicalUrl(localizeHref('/', locale))
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${getCanonicalUrl()}#organization`,
        name: seoConfig.siteName,
        url: getCanonicalUrl(),
        logo: getCanonicalUrl('/web-app-manifest-512x512.png')
      },
      {
        '@type': 'WebSite',
        '@id': `${url}#website`,
        name: seoConfig.siteName,
        url,
        description,
        inLanguage: locale,
        publisher: { '@id': `${getCanonicalUrl()}#organization` },
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
  breadcrumbs,
  locale = 'en'
}: {
  locale?: Locale
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
        url: getCanonicalUrl(localizeHref(path, locale)),
        inLanguage: locale,
        name: toPlainText(title),
        description: toPlainText(description),
        isPartOf: { '@id': `${getCanonicalUrl(localizeHref('/', locale))}#website` }
      },
      buildBreadcrumbJsonLd(breadcrumbs)
    ]
  }
}

export function buildListingJsonLd(
  listing: Pick<ListingDetails, 'id' | 'title' | 'description' | 'price' | 'currency' | 'images' | 'status' | 'publiclyVisible'>,
  breadcrumbs: SeoBreadcrumb[],
  { includeOffer = false, locale = 'en' }: { includeOffer?: boolean; locale?: Locale } = {}
): JsonLd | null {
  if (listing.status !== 'ACTIVE' || !listing.publiclyVisible) return null

  const url = getCanonicalUrl(localizeHref(`/listings/${listing.id}`, locale))
  const name = toPlainText(listing.title)
  const description = toPlainText(listing.description)
  const images = listing.images.map(({ url }) => url)

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        url,
        inLanguage: locale,
        name,
        description,
        ...(images.length && { image: images }),
        isPartOf: { '@id': `${getCanonicalUrl(localizeHref('/', locale))}#website` },
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
