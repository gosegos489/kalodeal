import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type SearchCategory = { slug: string; name: string }

type ListingSearchSelectProps = {
  categories: SearchCategory[]
  value: string
  onValueChange: (value: string | null) => void
}

export function ListingSearchSelect({ categories, value, onValueChange }: ListingSearchSelectProps) {
  const items = [{ value: '', label: 'All categories' }, ...categories.map(({ slug, name }) => ({ value: slug, label: name }))]

  return (
    <Select value={value} onValueChange={onValueChange} items={items}>
      <SelectTrigger aria-label="Listing category" className="w-full min-w-0 data-[size=default]:h-12 sm:w-64 sm:shrink-0">
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
