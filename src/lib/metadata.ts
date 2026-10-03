import type { Metadata } from 'next'
import 'server-only'
import type { ListingDetails } from '@/entities/listing/types'

const domainUrl = process.env.DOMAIN_URL
if (!domainUrl) throw new Error('DOMAIN_URL is not defined')

const siteUrl = new URL(domainUrl)
if (!['https:', 'http:'].includes(siteUrl.protocol) || siteUrl.username || siteUrl.password) {
  throw new Error('DOMAIN_URL must be an absolute HTTP(S) URL without credentials')
}

export const seoConfig = {
  siteName: process.env.PROJECT_NAME?.trim() || 'Kalodeal',
  siteUrl: siteUrl.origin,
  description: 'Buy, sell, and discover local deals on Kalodeal. Browse listings, services, and everyday finds from your local community.',
  ogImage: '/og-image.png',
  locale: 'en_US',
  isUnderDevelopment: process.env.SHOW_UNDER_DEVELOPMENT === 'true'
} as const

export const privateMetadata: Metadata = {
  robots: { index: false, follow: false },
  openGraph: null,
  twitter: null
}

// Callers provide canonical route paths and only intentional query parameters.
export function getCanonicalUrl(path = '/') {
  const url = new URL(path, seoConfig.siteUrl)
  url.hash = ''
  return url.toString()
}

export function getCategoryPath(slug: string) {
  return `/?category=${encodeURIComponent(slug)}`
}

export function toPlainText(value: string) {
  return value
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function summarizeDescription(value: string, maxLength = 160) {
  const characters = Array.from(toPlainText(value))
  if (characters.length <= maxLength) return characters.join('')

  const excerpt = characters.slice(0, maxLength - 1).join('')
  const wordBoundary = excerpt.lastIndexOf(' ')
  return `${(wordBoundary >= excerpt.length * 0.8 ? excerpt.slice(0, wordBoundary) : excerpt).trimEnd()}…`
}

export function formatSeoTitle(title: string) {
  return `${toPlainText(title)} | ${seoConfig.siteName}`
}

const defaultOpenGraph = {
  siteName: seoConfig.siteName,
  locale: seoConfig.locale,
  type: 'website',
  images: [{ url: seoConfig.ogImage, width: 1200, height: 630, alt: `${seoConfig.siteName} — buy and sell locally` }]
} satisfies NonNullable<Metadata['openGraph']>

const defaultTwitter = {
  card: 'summary_large_image',
  images: [seoConfig.ogImage]
} satisfies NonNullable<Metadata['twitter']>

export const rootMetadata: Metadata = {
  metadataBase: new URL(seoConfig.siteUrl),
  title: {
    default: `${seoConfig.siteName} | Buy and Sell Locally`,
    template: `%s | ${seoConfig.siteName}`
  },
  description: seoConfig.description,
  applicationName: seoConfig.siteName,
  // Public pages opt in through buildMetadata; unmatched/error pages stay noindex.
  robots: { index: false, follow: !seoConfig.isUnderDevelopment },
  openGraph: {
    ...defaultOpenGraph,
    title: `${seoConfig.siteName} | Buy and Sell Locally`,
    description: seoConfig.description,
    url: getCanonicalUrl()
  },
  twitter: {
    ...defaultTwitter,
    title: `${seoConfig.siteName} | Buy and Sell Locally`,
    description: seoConfig.description
  }
}

interface BuildMetadataParams {
  title?: string
  description?: string
  path?: string
  image?: string | null
  imageAlt?: string
  robots?: Metadata['robots']
}

export function buildMetadata({
  title = 'Buy and Sell Locally',
  description = seoConfig.description,
  path = '/',
  image,
  imageAlt = title,
  robots
}: BuildMetadataParams = {}): Metadata {
  const url = getCanonicalUrl(path)
  const socialTitle = formatSeoTitle(title)
  const summary = summarizeDescription(description) || seoConfig.description
  const images = image ? [{ url: image, alt: toPlainText(imageAlt) }] : defaultOpenGraph.images

  // Next.js replaces nested metadata rather than deeply merging it. Reuse defaults here.
  return {
    title: toPlainText(title),
    description: summary,
    alternates: { canonical: url },
    robots: seoConfig.isUnderDevelopment ? privateMetadata.robots : (robots ?? { index: true, follow: true }),
    openGraph: { ...defaultOpenGraph, title: socialTitle, description: summary, url, images: [...images] },
    twitter: { ...defaultTwitter, title: socialTitle, description: summary, images: image ? [image] : [...defaultTwitter.images] }
  }
}

export function buildListingMetadata(listing: Pick<ListingDetails, 'id' | 'title' | 'description' | 'coverUrl' | 'status'> | null): Metadata {
  if (!listing) {
    return { ...privateMetadata, title: 'Listing Not Found', description: 'This listing could not be found.', alternates: { canonical: null } }
  }
  if (listing.status !== 'ACTIVE') {
    return {
      ...privateMetadata,
      title: 'Private listing',
      description: 'This listing is available to its owner only.',
      alternates: { canonical: null }
    }
  }

  return buildMetadata({
    title: listing.title,
    description: listing.description,
    path: `/listings/${listing.id}`,
    image: listing.coverUrl,
    imageAlt: listing.title
  })
}
