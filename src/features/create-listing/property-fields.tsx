'use client'

import { Controller, useWatch } from 'react-hook-form'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { previewCategoryAttributeChange } from '@/features/listing-attributes/category-change'
import { propertyTypeLabels } from '@/features/listing-attributes/labels'
import { type CategoryAttributeProfile, getPropertyAmenities, getPropertyFields } from '@/features/listing-attributes/rules'
import { ATTRIBUTE_LIMITS } from '@/features/listing-attributes/schema'
import { PropertyEnergyRating, PropertyFurnishing, PropertyParking, PropertyType } from '@/generated/prisma/enums'
import { AttributeBoolean, AttributeNumber, AttributeSelect, AttributeText, attributeLabel, enumOptions } from './attribute-controls'
import type { ListingFormApi } from './types'
import { getFormAttributes, useAttributeChange } from './use-attribute-change'

export function PropertyFields({
  form,
  profile,
  categorySlug,
  disabled
}: {
  form: ListingFormApi
  profile: Extract<CategoryAttributeProfile, { kind: 'property' }>
  categorySlug: string
  disabled: boolean
}) {
  const property = useWatch({ control: form.control, name: 'propertyDetails' })
  const type = property?.propertyType ?? (profile.propertyTypes.length === 1 ? profile.propertyTypes[0] : undefined)
  const fields = type ? getPropertyFields(profile, type) : []
  const { requestChange, dialog } = useAttributeChange(form)
  const ensureProperty = () => {
    if (!form.getValues('propertyDetails')?.propertyType && type)
      form.setValue('propertyDetails', { propertyType: type, amenities: [] }, { shouldDirty: true })
  }
  const control = { form, disabled, beforeChange: ensureProperty }
  return (
    <section className="bg-card flex min-w-0 flex-col gap-6 rounded-2xl border p-5 shadow-xs sm:p-7" aria-labelledby="property-heading">
      <div className="space-y-1 border-b pb-5">
        <h2 id="property-heading" className="text-lg font-semibold">
          Property details
        </h2>
        <p className="text-muted-foreground text-sm">Add the characteristics that apply. These details are optional.</p>
      </div>
      <AttributeSelect
        form={form}
        disabled={disabled}
        name="propertyDetails.propertyType"
        displayValue={property?.propertyType ?? ''}
        allowEmpty={profile.propertyTypes.length > 1}
        label="Property type"
        placeholder="Not specified"
        options={profile.propertyTypes.map((value) => ({ value, label: propertyTypeLabels[value] }))}
        onChange={(value) => {
          const parsed = Object.values(PropertyType).find((item) => item === value)
          const current = getFormAttributes(form)
          if (!parsed) {
            requestChange({ ...current, propertyDetails: null }, ['propertyDetails'])
            return
          }
          const preview = previewCategoryAttributeChange(categorySlug, current, parsed)
          if (!preview.attributes.propertyDetails) preview.attributes.propertyDetails = { propertyType: parsed, amenities: [] }
          requestChange(preview.attributes, preview.removedFields)
        }}
      />
      <div className="grid min-w-0 gap-5 sm:grid-cols-2">
        {fields.includes('plotArea') && (
          <AttributeNumber
            {...control}
            name="propertyDetails.plotArea"
            label="Plot area (m²)"
            min={0.01}
            max={ATTRIBUTE_LIMITS.plotArea}
            step={0.01}
          />
        )}
        {fields.includes('propertyArea') && (
          <AttributeNumber
            {...control}
            name="propertyDetails.propertyArea"
            label="Property area (m²)"
            min={0.01}
            max={ATTRIBUTE_LIMITS.propertyArea}
            step={0.01}
          />
        )}
        {fields.includes('bedrooms') && (
          <AttributeNumber {...control} name="propertyDetails.bedrooms" label="Bedrooms" max={ATTRIBUTE_LIMITS.rooms} />
        )}
        {fields.includes('bathrooms') && (
          <AttributeNumber {...control} name="propertyDetails.bathrooms" label="Bathrooms" max={ATTRIBUTE_LIMITS.rooms} />
        )}
        {fields.includes('constructionYear') && (
          <AttributeNumber
            {...control}
            name="propertyDetails.constructionYear"
            label="Construction year"
            min={ATTRIBUTE_LIMITS.constructionYearMin}
            max={Math.min(new Date().getUTCFullYear() + 1, ATTRIBUTE_LIMITS.yearMax)}
          />
        )}
        {fields.includes('parking') && (
          <AttributeSelect {...control} name="propertyDetails.parking" label="Parking" options={enumOptions(Object.values(PropertyParking))} />
        )}
        {fields.includes('airConditioning') && <AttributeBoolean {...control} name="propertyDetails.airConditioning" label="Air conditioning" />}
        {fields.includes('furnishing') && (
          <AttributeSelect
            {...control}
            name="propertyDetails.furnishing"
            label="Furnishing"
            options={enumOptions(Object.values(PropertyFurnishing))}
          />
        )}
        {fields.includes('petsAllowed') && <AttributeBoolean {...control} name="propertyDetails.petsAllowed" label="Pets allowed" />}
        {fields.includes('onlineViewing') && <AttributeBoolean {...control} name="propertyDetails.onlineViewing" label="Online viewing" />}
        {fields.includes('energyRating') && (
          <AttributeSelect
            {...control}
            name="propertyDetails.energyRating"
            label="Energy efficiency"
            options={enumOptions(Object.values(PropertyEnergyRating))}
          />
        )}
        {fields.includes('postalCode') && <AttributeText {...control} name="propertyDetails.postalCode" label="Postal code" maxLength={16} />}
      </div>
      {type && fields.includes('amenities') && (
        <Controller
          name="propertyDetails.amenities"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <fieldset className="space-y-3" disabled={disabled}>
                <legend className="text-sm font-medium">Included amenities</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {getPropertyAmenities(type).map((amenity, index) => (
                    <FieldLabel
                      key={amenity}
                      htmlFor={`amenity-${amenity}`}
                      data-invalid={fieldState.invalid}
                      className="data-[invalid=true]:border-destructive has-[:focus-visible]:outline-ring flex min-h-10 cursor-pointer items-center gap-3 rounded-lg border p-3 font-normal has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2"
                    >
                      <Checkbox
                        id={`amenity-${amenity}`}
                        ref={index === 0 ? field.ref : undefined}
                        onBlur={field.onBlur}
                        checked={(field.value ?? []).includes(amenity)}
                        disabled={disabled}
                        aria-invalid={fieldState.invalid}
                        aria-describedby={fieldState.error ? 'amenities-error' : undefined}
                        onCheckedChange={(checked) => {
                          ensureProperty()
                          field.onChange(checked ? [...(field.value ?? []), amenity] : (field.value ?? []).filter((item) => item !== amenity))
                        }}
                      />
                      {attributeLabel(amenity)}
                    </FieldLabel>
                  ))}
                </div>
              </fieldset>
              {fieldState.error && <FieldError id="amenities-error" errors={[fieldState.error]} />}
            </Field>
          )}
        />
      )}
      {!type && <FieldDescription>Choose a property type to see its available characteristics.</FieldDescription>}
      {form.formState.errors.propertyDetails?.message && <FieldError errors={[form.formState.errors.propertyDetails]} />}
      {dialog}
    </section>
  )
}
