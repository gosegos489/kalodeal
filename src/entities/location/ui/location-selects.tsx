'use client'

import type { Ref } from 'react'
import { ComboboxSelect } from '@/components/ui/combobox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CYPRUS_LOCATIONS, getAreas } from '../catalog'

type LocationSelectProps = {
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
  allowAll,
  disabled,
  invalid,
  id,
  inputRef,
  onBlur,
  'aria-describedby': describedBy,
  className
}: LocationSelectProps) {
  const items = allowAll ? [{ value: '', label: 'All districts' }, ...districts] : districts
  return (
    <Select value={value || (allowAll ? '' : null)} onValueChange={(value) => onValueChange(value ?? '')} items={items} disabled={disabled}>
      <SelectTrigger
        id={id}
        ref={inputRef}
        onBlur={onBlur}
        aria-label="District"
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className={className ?? 'w-full'}
      >
        <SelectValue placeholder="Choose a district" />
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

export function AreaSelect({ district, allowAll, disabled, ...props }: LocationSelectProps & { district: string }) {
  const areas = getAreas(district)
  const items = allowAll ? [{ value: '', label: 'All areas' }, ...areas] : areas
  return (
    <ComboboxSelect
      {...props}
      items={items}
      disabled={disabled || !areas.length}
      label="Area"
      placeholder={areas.length ? 'Choose an area' : 'Choose a district first'}
      searchPlaceholder="Search areas..."
    />
  )
}
