import type { MetadataRoute } from 'next'

const SITE_URL = process.env.DOMAIN_URL

if (!SITE_URL) {
  throw new Error('DOMAIN_URL is not defined')
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/'
    },
    sitemap: `${SITE_URL}/sitemap.xml`
  }
}
