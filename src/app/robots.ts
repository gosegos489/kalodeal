import type { MetadataRoute } from 'next'
import { getListingSitemapIds } from '@/entities/listing/get-listing-sitemap'
import { getCanonicalUrl, seoConfig } from '@/lib/metadata'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const listingSitemaps = seoConfig.isUnderDevelopment ? [] : await getListingSitemapIds()
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // HTML pages must remain crawlable so their noindex directives can be read.
      disallow: ['/api/']
    },
    ...(seoConfig.isUnderDevelopment
      ? {}
      : {
          sitemap: [getCanonicalUrl('/sitemap.xml'), ...listingSitemaps.map(({ id }) => getCanonicalUrl(`/listings/sitemap/${id}.xml`))]
        })
  }
}
