'use client'

import { useMessages, useTranslations } from 'next-intl'
import type { SearchKey } from '../model/search-params'
import { filterLabel } from '../model/search-params'

export function useSearchLabels() {
  const t = useTranslations('Search')
  const messages = useMessages()
  const values: Record<string, string> = messages.Attributes?.values ?? {}
  const locations: Record<string, string> = messages.Locations
  return {
    t,
    field: (name: SearchKey) => t(`fields.${name}`),
    value: (value: string) => (Object.hasOwn(values, value) ? values[value] : filterLabel(value)),
    district: (slug: string, fallback: string) => (Object.hasOwn(locations, slug) ? locations[slug] : fallback)
  }
}
