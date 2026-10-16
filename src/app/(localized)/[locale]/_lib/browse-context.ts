import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import 'server-only'
import { cache } from 'react'
import { getCategoryTaxonomy } from '@/entities/category/get-category-taxonomy'
import { getPublicCategory } from '@/entities/category/get-category-tree'
import { getCategoryAttributeProfile } from '@/features/listing-attributes/rules'
import { parseListingSearch } from '@/features/listing-search/model/search-params'
import { categoryName } from '@/i18n/category-name'
import { localizedLocation } from '@/i18n/location-name'
import { getCategoryPath } from '@/lib/metadata'

export type HomePageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export const getBrowseContext = cache(async (searchParams: HomePageProps['searchParams']) => {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'Metadata' })
  const messages = await getMessages({ locale })
  const raw = await searchParams
  const taxonomy = await getCategoryTaxonomy()
  const selected = taxonomy.find((category) => category.slug === raw.category)
  const profile = getCategoryAttributeProfile(selected?.slug ?? '')
  const result = parseListingSearch(raw, profile)
  const filters = result.success ? result.base : {}
  const category = filters.category ? await getPublicCategory(filters.category) : null
  const isSearch = 'q' in raw || Object.keys(raw).some((key) => key !== 'category') || !result.success || ('category' in raw && !category)
  const location = localizedLocation({ district: filters.district ?? null, area: filters.area ?? null }, messages.Locations)
  const name = category ? categoryName(category.category, messages.CategoryNames) : ''
  const title = filters.query
    ? t('searchTitle', { query: filters.query })
    : category
      ? t('categoryTitle', { category: name })
      : location
        ? t('locationTitle', { location })
        : t('homeTitle')
  const description = filters.query
    ? t('searchDescription')
    : category
      ? t('categoryDescription', { category: name })
      : location
        ? t('locationDescription', { location })
        : t('homeDescription')

  return {
    filters,
    attributes: result.success ? result.attributes : undefined,
    pageParam: raw.page,
    filterError: result.success ? null : result.message,
    category,
    isSearch,
    invalidFilters: !result.success,
    location,
    title,
    description,
    path: category ? getCategoryPath(category.category.slug) : '/'
  }
})
