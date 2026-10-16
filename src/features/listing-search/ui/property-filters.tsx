'use client'

import { useId } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { type CategoryAttributeProfile, getPropertyAmenities, getPropertyFields } from '@/features/listing-attributes/rules'
import { ATTRIBUTE_LIMITS } from '@/features/listing-attributes/schema'
import { PropertyEnergyRating, PropertyFurnishing, PropertyParking, PropertyType } from '@/generated/prisma/enums'
import { filterLabel } from '../model/search-params'
import { type FilterControlProps, FilterRange, FilterSelect, enumOptions } from './filter-controls'

export function PropertyFilters({ profile, ...control }: FilterControlProps & { profile: Extract<CategoryAttributeProfile, { kind: 'property' }> }) {
  const id = useId()
  const selected = Object.values(PropertyType).find((type) => type === control.values.propertyType)
  const types = selected && profile.propertyTypes.includes(selected) ? [selected] : profile.propertyTypes
  const fields = types.flatMap((type) => getPropertyFields(profile, type))
  const amenities = [...new Set(types.flatMap((type) => getPropertyAmenities(type)))]
  const chosen = control.values.amenities.split(',').filter(Boolean)
  return (
    <fieldset className="min-w-0 space-y-4 border-t pt-5" disabled={control.disabled}>
      <legend className="float-left mb-4 text-sm font-semibold">Property details</legend>
      <div className="clear-both space-y-4">
        <FilterSelect {...control} name="propertyType" options={enumOptions(profile.propertyTypes)} />
        {fields.includes('bedrooms') && (
          <FilterRange {...control} label="Bedrooms" from="minBedrooms" to="maxBedrooms" max={ATTRIBUTE_LIMITS.rooms} />
        )}
        {fields.includes('bathrooms') && (
          <FilterRange {...control} label="Bathrooms" from="minBathrooms" to="maxBathrooms" max={ATTRIBUTE_LIMITS.rooms} />
        )}
        {fields.includes('propertyArea') && (
          <FilterRange
            {...control}
            label="Property area (m²)"
            from="minPropertyArea"
            to="maxPropertyArea"
            min={0.01}
            max={ATTRIBUTE_LIMITS.propertyArea}
            step={0.01}
          />
        )}
        {fields.includes('plotArea') && (
          <FilterRange
            {...control}
            label="Plot area (m²)"
            from="minPlotArea"
            to="maxPlotArea"
            min={0.01}
            max={ATTRIBUTE_LIMITS.plotArea}
            step={0.01}
          />
        )}
        {fields.includes('constructionYear') && (
          <FilterRange
            {...control}
            label="Construction year"
            from="minConstructionYear"
            to="maxConstructionYear"
            min={ATTRIBUTE_LIMITS.constructionYearMin}
            max={Math.min(new Date().getUTCFullYear() + 1, ATTRIBUTE_LIMITS.yearMax)}
          />
        )}
        {fields.includes('parking') && <FilterSelect {...control} name="parking" options={enumOptions(Object.values(PropertyParking))} />}
        {fields.includes('furnishing') && <FilterSelect {...control} name="furnishing" options={enumOptions(Object.values(PropertyFurnishing))} />}
        {fields.includes('airConditioning') && (
          <FilterSelect
            {...control}
            name="airConditioning"
            options={[
              { value: 'true', label: 'Yes' },
              { value: 'false', label: 'No' }
            ]}
          />
        )}
        {fields.includes('petsAllowed') && (
          <FilterSelect
            {...control}
            name="petsAllowed"
            options={[
              { value: 'true', label: 'Yes' },
              { value: 'false', label: 'No' }
            ]}
          />
        )}
        {fields.includes('energyRating') && (
          <FilterSelect {...control} name="energyRating" options={enumOptions(Object.values(PropertyEnergyRating))} />
        )}
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">Amenities (all selected)</legend>
          {amenities.map((amenity) => (
            <label key={amenity} htmlFor={`${id}-${amenity}`} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm lg:min-h-9">
              <Checkbox
                id={`${id}-${amenity}`}
                checked={chosen.includes(amenity)}
                disabled={control.disabled}
                onCheckedChange={(checked) =>
                  control.change({ amenities: (checked ? [...chosen, amenity] : chosen.filter((item) => item !== amenity)).join(',') })
                }
              />
              {filterLabel(amenity)}
            </label>
          ))}
        </fieldset>
      </div>
    </fieldset>
  )
}
