'use client'

import type { Ref } from 'react'
import { ComboboxSelect } from '@/components/ui/combobox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CYPRUS_LOCATIONS, getAreas } from '../catalog'

type LocationLabels = {
  district: string
  area: string
  allCyprus: string
  allAreas: string
  chooseDistrict: string
  chooseArea: string
  districtFirst: string
  searchAreas: string
  districts: Record<string, string>
  noMatches?: string
}

const defaultLabels: LocationLabels = {
  district: 'District',
  area: 'Area',
  allCyprus: 'All Cyprus',
  allAreas: 'All areas',
  chooseDistrict: 'Choose a district',
  chooseArea: 'Choose an area',
  districtFirst: 'Choose a district first',
  searchAreas: 'Search areas...',
  districts: {}
}

type LocationSelectProps = {
  labels?: LocationLabels
  value: string
  onValueChange: (value: string) => void
  allowAll?: boolean
  disabled?: boolean
  invalid?: boolean
  id?: string
  inputRef?: Ref<HTMLButtonElement>
  onBlur?: () => void
  'aria-describedby'?: string
  className?: string
}

const districts = CYPRUS_LOCATIONS.map(({ slug, name }) => ({ value: slug, label: name }))

export function DistrictSelect({
  value,
  onValueChange,
  labels = defaultLabels,
  allowAll,
  disabled,
  invalid,
  id,
  inputRef,
  onBlur,
  'aria-describedby': describedBy,
  className
}: LocationSelectProps) {
  const translated = districts.map((item) => ({ ...item, label: labels.districts[item.value] ?? item.label }))
  const items = allowAll ? [{ value: '', label: labels.allCyprus }, ...translated] : translated
  return (
    <Select value={value || (allowAll ? '' : null)} onValueChange={(value) => onValueChange(value ?? '')} items={items} disabled={disabled}>
      <SelectTrigger
        id={id}
        ref={inputRef}
        onBlur={onBlur}
        aria-label={labels.district}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className={className ?? 'w-full'}
      >
        <SelectValue placeholder={allowAll ? labels.allCyprus : labels.chooseDistrict} />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function AreaSelect({ district, allowAll, disabled, labels = defaultLabels, ...props }: LocationSelectProps & { district: string }) {
  const areas = getAreas(district)
  const items = allowAll ? [{ value: '', label: labels.allAreas }, ...areas] : areas
  return (
    <ComboboxSelect
      {...props}
      items={items}
      disabled={disabled || !areas.length}
      label={labels.area}
      placeholder={areas.length ? labels.chooseArea : labels.districtFirst}
      searchPlaceholder={labels.searchAreas}
      emptyMessage={labels.noMatches}
    />
  )
}
