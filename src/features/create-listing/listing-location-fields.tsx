'use client'

import { Controller, type UseFormReturn, useWatch } from 'react-hook-form'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { isAreaInDistrict } from '@/entities/location/catalog'
import { AreaSelect, DistrictSelect } from '@/entities/location/ui/location-selects'
import type { CreateListingInput, CreateListingValues } from './types'

export function ListingLocationFields({
  form,
  disabled,
  missingLocation
}: {
  form: UseFormReturn<CreateListingInput, unknown, CreateListingValues>
  disabled: boolean
  missingLocation: boolean
}) {
  const district = useWatch({ control: form.control, name: 'district' })

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          name="district"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>District</FieldLabel>
              <DistrictSelect
                id={field.name}
                inputRef={field.ref}
                onBlur={field.onBlur}
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value)
                  if (!isAreaInDistrict(value, form.getValues('area'))) {
                    form.setValue('area', '', { shouldDirty: true, shouldValidate: form.formState.isSubmitted })
                  }
                }}
                disabled={disabled}
                invalid={fieldState.invalid}
                aria-describedby={fieldState.error ? 'district-error' : undefined}
              />
              {fieldState.invalid && <FieldError id="district-error" errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="area"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Area</FieldLabel>
              <AreaSelect
                key={district}
                district={district}
                id={field.name}
                inputRef={field.ref}
                onBlur={field.onBlur}
                value={field.value}
                onValueChange={field.onChange}
                disabled={disabled}
                invalid={fieldState.invalid}
                aria-describedby={fieldState.error ? 'area-error' : undefined}
              />
              {fieldState.invalid && <FieldError id="area-error" errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
      <FieldDescription>
        {missingLocation
          ? 'This listing has no location yet. Choose a district and area before saving.'
          : 'Choose the area where your item or service is available.'}
      </FieldDescription>
    </div>
  )
}
