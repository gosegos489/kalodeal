'use client'

import { useId } from 'react'
import { ComboboxSelect } from '@/components/ui/combobox'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type FilterUpdates, type SearchFilters, type SearchKey, filterLabel } from '../model/search-params'
import { useSearchLabels } from './use-search-labels'

export type FilterControlProps = { values: SearchFilters; change: (updates: FilterUpdates) => void; disabled: boolean }
export type FilterOption = { value: string; label: string }
export const enumOptions = (values: readonly string[]) => values.map((value) => ({ value, label: filterLabel(value) }))

export function FilterSelect({
  values,
  change,
  disabled,
  name,
  options,
  label: suppliedLabel,
  searchable,
  placeholder: suppliedPlaceholder,
  unavailable = false
}: FilterControlProps & {
  name: SearchKey
  options: FilterOption[]
  label?: string
  searchable?: boolean
  placeholder?: string
  unavailable?: boolean
}) {
  const { t, field, value: valueLabel } = useSearchLabels()
  const label = suppliedLabel ?? field(name)
  const placeholder = suppliedPlaceholder ?? t('any')
  const id = useId()
  const value = name === 'sort' && values[name] === 'RECENT' ? '' : values[name]
  const items = [
    { value: '', label: placeholder },
    ...options.map((option) => ({
      ...option,
      label: ['make', 'model', 'district', 'area', 'category'].includes(name) ? option.label : valueLabel(option.value)
    }))
  ]
  // Keep invalid incoming URL values visible and removable.
  if (value && !items.some((item) => item.value === value)) items.push({ value, label: t('invalid', { value: value.slice(0, 80) }) })
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {searchable ? (
        <ComboboxSelect
          id={id}
          label={label}
          items={items}
          value={value}
          disabled={disabled || unavailable}
          placeholder={placeholder}
          searchPlaceholder={t('searchOptions', { label })}
          emptyMessage={t('noMatches')}
          onValueChange={(value) => change({ [name]: value })}
          className="h-11 lg:h-8"
        />
      ) : (
        <Select value={value} items={items} disabled={disabled || unavailable} onValueChange={(value) => change({ [name]: value })}>
          <SelectTrigger id={id} className="w-full min-w-0 data-[size=default]:h-11 lg:data-[size=default]:h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </Field>
  )
}

export function FilterRange({
  values,
  change,
  disabled,
  label,
  from,
  to,
  min = 0,
  max,
  step = 1
}: FilterControlProps & {
  label: string
  from: SearchKey
  to: SearchKey
  min?: number
  max: number
  step?: number
}) {
  const id = useId()
  const { t, field } = useSearchLabels()
  return (
    <fieldset className="min-w-0 space-y-2" disabled={disabled}>
      <legend className="text-sm font-medium">{label}</legend>
      <div className="grid min-w-0 grid-cols-2 gap-2">
        {[from, to].map((name, index) => (
          <div key={name} className="min-w-0">
            <label className="sr-only" htmlFor={`${id}-${name}`}>
              {field(name)}
            </label>
            <Input
              id={`${id}-${name}`}
              name={name}
              type="number"
              inputMode={step === 1 ? 'numeric' : 'decimal'}
              min={min}
              max={max}
              step={step}
              placeholder={index ? t('to') : t('minimum')}
              value={values[name]}
              className="h-11 lg:h-8"
              onChange={(event) => change({ [name]: event.target.value })}
            />
          </div>
        ))}
      </div>
    </fieldset>
  )
}
