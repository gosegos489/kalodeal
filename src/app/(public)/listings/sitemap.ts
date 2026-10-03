import type { MetadataRoute } from 'next'
import { getListingSitemapIds, getListingSitemapPage } from '@/entities/listing/get-listing-sitemap'
import { getCanonicalUrl, seoConfig } from '@/lib/metadata'

export async function generateSitemaps() {
  return seoConfig.isUnderDevelopment ? [] : getListingSitemapIds()
}

export default async function sitemap({ id }: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const value = await id
  if (seoConfig.isUnderDevelopment || !/^(0|[1-9]\d*)$/.test(value)) return []

  const listings = await getListingSitemapPage(Number(value))
  return listings.map((listing) => ({ url: getCanonicalUrl(`/listings/${listing.id}`), lastModified: listing.updatedAt }))
}
