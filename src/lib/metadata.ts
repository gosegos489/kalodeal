import 'server-only'

import type { Metadata } from 'next'

const PROJECT_NAME = process.env.PROJECT_NAME!
const DOMAIN_URL = process.env.DOMAIN_URL
const DEFAULT_DESCRIPTION = 'Buy, sell, and discover local deals on Kalodeal — a simple marketplace for listings, services, and everyday finds.'
const DEFAULT_OG_IMAGE = '/og-image.png'
const DEFAULT_LOCALE = 'en_US'

if (!DOMAIN_URL) {
  throw new Error('DOMAIN_URL or PROJECT_NAME is not defined')
}

interface BuildMetadataParams {
  title?: string
  description?: string
  path?: string
  image?: string
}

export const rootMetadata: Metadata = {
  metadataBase: new URL(DOMAIN_URL),

  title: {
    default: PROJECT_NAME,
    template: `%s | ${PROJECT_NAME}`
  },

  description: DEFAULT_DESCRIPTION,

  openGraph: {
    title: PROJECT_NAME,
    description: DEFAULT_DESCRIPTION,
    url: DOMAIN_URL,
    siteName: PROJECT_NAME,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630
      }
    ],
    locale: DEFAULT_LOCALE,
    type: 'website'
  },

  twitter: {
    card: 'summary_large_image',
    title: PROJECT_NAME,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE]
  }
}

export function buildMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  image = DEFAULT_OG_IMAGE
}: BuildMetadataParams = {}): Metadata {
  const url = new URL(path, DOMAIN_URL).toString()

  const socialTitle = title ? `${title} | ${PROJECT_NAME}` : PROJECT_NAME

  return {
    ...(title ? { title } : {}),

    description,

    alternates: {
      canonical: url
    },

    openGraph: {
      title: socialTitle,
      description,
      url,
      siteName: PROJECT_NAME,
      images: [
        {
          url: image,
          width: 1200,
          height: 630
        }
      ],
      locale: DEFAULT_LOCALE,
      type: 'website'
    },

    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: [image]
    }
  }
}
