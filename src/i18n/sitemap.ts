import type { MetadataRoute } from 'next'
import 'server-only'
import { getCanonicalUrl, getLanguageAlternates } from '@/lib/metadata'
import { localizeHref, routing } from './routing'

export function localizedSitemapEntries(path: string, lastModified?: Date): MetadataRoute.Sitemap {
  const languages = getLanguageAlternates(path)
  return routing.locales.map((locale) => ({
    url: getCanonicalUrl(localizeHref(path, locale)),
    ...(lastModified && { lastModified }),
    alternates: { languages }
  }))
}
