'use client'

import { Controller, type FieldPath, useWatch } from 'react-hook-form'
import { ComboboxSelect } from '@/components/ui/combobox'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { attributeLabel } from '@/features/listing-attributes/labels'
import type { CreateListingInput, ListingFormApi } from './types'

type ControlProps = {
  form: ListingFormApi
  name: FieldPath<CreateListingInput>
  label: string
  disabled: boolean
  beforeChange?: () => void
}
export type AttributeOption = { value: string; label: string }
export const enumOptions = (values: readonly string[]): AttributeOption[] => values.map((value) => ({ value, label: attributeLabel(value) }))
export { attributeLabel } from '@/features/listing-attributes/labels'

export function AttributeSelect({
  form,
  name,
  label,
  disabled,
  beforeChange,
  options,
  searchable,
  onChange,
  placeholder = 'Not specified',
  displayValue,
  allowEmpty = true
}: ControlProps & {
  options: AttributeOption[]
  searchable?: boolean
  onChange?: (value: string | null) => void
  placeholder?: string
  displayValue?: string
  allowEmpty?: boolean
}) {
  const items = allowEmpty ? [{ value: '', label: placeholder }, ...options] : options
  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => {
        const change = (value: string | null) => {
          beforeChange?.()
          if (onChange) onChange(value || null)
          else field.onChange(value || null)
        }
        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={name}>{label}</FieldLabel>
            {searchable ? (
              <ComboboxSelect
                id={name}
                inputRef={field.ref}
                onBlur={field.onBlur}
                label={label}
                items={items}
                value={displayValue ?? (typeof field.value === 'string' ? field.value : '')}
                onValueChange={change}
                placeholder={placeholder}
                disabled={disabled}
                invalid={fieldState.invalid}
                aria-describedby={fieldState.error ? `${name}-error` : undefined}
              />
            ) : (
              <Select
                value={(displayValue ?? (typeof field.value === 'string' ? field.value : '')) || (allowEmpty ? '' : null)}
                onValueChange={change}
                items={items}
                disabled={disabled}
              >
                <SelectTrigger
                  ref={field.ref}
                  id={name}
                  onBlur={field.onBlur}
                  className="w-full"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? `${name}-error` : undefined}
                >
                  <SelectValue placeholder={placeholder} />
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
            {fieldState.error && <FieldError id={`${name}-error`} errors={[fieldState.error]} />}
          </Field>
        )
      }}
    />
  )
}

export function AttributeNumber({
  form,
  name,
  label,
  disabled,
  beforeChange,
  min = 0,
  max,
  step = 1
}: ControlProps & { min?: number; max: number; step?: number }) {
  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Input
            id={name}
            name={name}
            ref={field.ref}
            onBlur={field.onBlur}
            value={typeof field.value === 'number' ? field.value : ''}
            type="number"
            inputMode={step === 1 ? 'numeric' : 'decimal'}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            aria-invalid={fieldState.invalid}
            aria-describedby={fieldState.error ? `${name}-error` : undefined}
            onChange={(event) => {
              beforeChange?.()
              field.onChange(event.target.value === '' ? null : event.target.valueAsNumber)
            }}
          />
          {fieldState.error && <FieldError id={`${name}-error`} errors={[fieldState.error]} />}
        </Field>
      )}
    />
  )
}

export function AttributeText({ form, name, label, disabled, beforeChange, maxLength }: ControlProps & { maxLength: number }) {
  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Input
            id={name}
            name={name}
            ref={field.ref}
            onBlur={field.onBlur}
            value={typeof field.value === 'string' ? field.value : ''}
            maxLength={maxLength}
            disabled={disabled}
            aria-invalid={fieldState.invalid}
            aria-describedby={fieldState.error ? `${name}-error` : undefined}
            onChange={(event) => {
              beforeChange?.()
              field.onChange(event.target.value.trim() === '' ? null : event.target.value)
            }}
          />
          {fieldState.error && <FieldError id={`${name}-error`} errors={[fieldState.error]} />}
        </Field>
      )}
    />
  )
}

export function AttributeBoolean(props: ControlProps) {
  const { form, name, beforeChange } = props
  const value = useWatch({ control: form.control, name })
  return (
    <AttributeSelect
      {...props}
      beforeChange={undefined}
      displayValue={value == null ? '' : value === true ? 'yes' : 'no'}
      options={[
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' }
      ]}
      name={name}
      onChange={(value) => {
        beforeChange?.()
        form.setValue(name, value === null ? null : value === 'yes', { shouldDirty: true, shouldValidate: form.formState.isSubmitted })
      }}
    />
  )
}
