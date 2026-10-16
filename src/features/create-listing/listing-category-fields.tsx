'use client'

import { Controller } from 'react-hook-form'
import { ComboboxSelect } from '@/components/ui/combobox'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { previewCategoryAttributeChange } from '@/features/listing-attributes/category-change'
import { getCategoryAttributeProfile } from '@/features/listing-attributes/rules'
import type { ListingCategoryOption, ListingFormApi } from './types'
import { getFormAttributes, useAttributeChange } from './use-attribute-change'

export function ListingCategoryFields({
  form,
  categories,
  disabled
}: {
  form: ListingFormApi
  categories: ListingCategoryOption[]
  disabled: boolean
}) {
  const { requestChange, dialog } = useAttributeChange(form)
  function change(id: string) {
    const category = categories.find((item) => item.id === id)
    if (!category || id === form.getValues('categoryId')) return
    const { attributes, removedFields } = previewCategoryAttributeChange(category.slug, getFormAttributes(form))
    const profile = getCategoryAttributeProfile(category.slug)
    if (profile.kind === 'property' && !attributes.propertyDetails && profile.propertyTypes.length === 1)
      attributes.propertyDetails = { propertyType: profile.propertyTypes[0], amenities: [] }
    if (profile.kind === 'vehicle' && !attributes.vehicleDetails) attributes.vehicleDetails = { vehicleType: profile.vehicleType }
    requestChange(attributes, removedFields, id)
  }
  return (
    <>
      <Controller
        name="categoryId"
        control={form.control}
        render={({ field, fieldState }) => {
          const selected = categories.find((category) => category.id === field.value)
          const path: ListingCategoryOption[] = []
          let current = selected
          while (current && !path.some((item) => item.id === current?.id)) {
            path.unshift(current)
            current = categories.find((category) => category.id === current?.parentId)
          }
          const levels = [categories.filter((category) => category.parentId === null)]
          for (const item of path) {
            const children = categories.filter((category) => category.parentId === item.id)
            if (children.length) levels.push(children)
          }
          return (
            <Field data-invalid={fieldState.invalid}>
              <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                {levels.map((items, index) => {
                  const label = ['Main category', 'Subcategory', 'Listing type'][index] ?? 'Listing type'
                  const id = index === 0 ? field.name : `${field.name}-${index}`
                  return (
                    <div className="min-w-0 space-y-2" key={items[0]?.parentId ?? 'main'}>
                      <FieldLabel htmlFor={id}>{label}</FieldLabel>
                      <ComboboxSelect
                        id={id}
                        inputRef={index === 0 ? field.ref : undefined}
                        onBlur={field.onBlur}
                        label={label}
                        items={items.map((item) => ({ value: item.id, label: item.name.split(' / ').at(-1) ?? item.name }))}
                        value={path[index]?.id ?? ''}
                        onValueChange={change}
                        placeholder={`Choose ${label.toLowerCase()}`}
                        disabled={disabled}
                        invalid={fieldState.invalid}
                        aria-describedby={fieldState.error ? 'category-error' : undefined}
                      />
                    </div>
                  )
                })}
              </div>
              <FieldDescription>Choose the closest category and continue through its subcategories to find the right listing type.</FieldDescription>
              {fieldState.error && <FieldError id="category-error" errors={[fieldState.error]} />}
            </Field>
          )
        }}
      />
      {dialog}
    </>
  )
}
