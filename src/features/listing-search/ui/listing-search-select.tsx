'use client'

import { useTranslations } from 'next-intl'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type SearchCategory = { slug: string; name: string }

type ListingSearchSelectProps = {
  categories: SearchCategory[]
  value: string
  onValueChange: (value: string | null) => void
}

export function ListingSearchSelect({ categories, value, onValueChange }: ListingSearchSelectProps) {
  const t = useTranslations('Search')
  const items = [{ value: '', label: t('allCategories') }, ...categories.map(({ slug, name }) => ({ value: slug, label: name }))]
  if (value && !items.some((item) => item.value === value)) items.push({ value, label: value })

  return (
    <Select value={value} onValueChange={onValueChange} items={items}>
      <SelectTrigger aria-label={t('listingCategory')} className="w-full min-w-0 data-[size=default]:h-12">
        <SelectValue className="min-w-0 overflow-hidden" />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        {items.map(({ value, label }) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
