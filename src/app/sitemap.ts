import type { MetadataRoute } from 'next'
import { getPublicCategories } from '@/entities/category/get-category-tree'
import { getLegal } from '@/entities/legal/get-legal'
import { getCanonicalUrl, getCategoryPath, seoConfig } from '@/lib/metadata'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (seoConfig.isUnderDevelopment) return []

  const [categories, privacy, terms] = await Promise.all([getPublicCategories(), getLegal('PRIVACY_POLICY'), getLegal('TERMS_OF_USE')])

  return [
    ...['/', '/categories', '/how-it-works', '/safety', '/contact-us'].map((path) => ({ url: getCanonicalUrl(path) })),
    ...categories.map(({ category }) => ({ url: getCanonicalUrl(getCategoryPath(category.slug)) })),
    ...(privacy ? [{ url: getCanonicalUrl('/legal/privacy-policy'), lastModified: privacy.updatedAt }] : []),
    ...(terms ? [{ url: getCanonicalUrl('/legal/terms-of-use'), lastModified: terms.updatedAt }] : [])
  ]
}
