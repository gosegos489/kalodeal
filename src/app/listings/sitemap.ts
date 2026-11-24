import type { MetadataRoute } from 'next'
import { getListingSitemapIds, getListingSitemapPage } from '@/entities/listing/get-listing-sitemap'
import { localizedSitemapEntries } from '@/i18n/sitemap'
import { seoConfig } from '@/lib/metadata'

export async function generateSitemaps() {
  return seoConfig.isUnderDevelopment ? [] : getListingSitemapIds()
}

export default async function sitemap({ id }: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const value = await id
  if (seoConfig.isUnderDevelopment || !/^(0|[1-9]\d*)$/.test(value)) return []

  const listings = await getListingSitemapPage(Number(value))
  return listings.flatMap((listing) => localizedSitemapEntries(`/listings/${listing.id}`, listing.updatedAt))
}
