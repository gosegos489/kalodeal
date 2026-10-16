'use client'

import { type CategoryAttributeProfile, getVehicleBodyTypes } from '@/features/listing-attributes/rules'
import { ATTRIBUTE_LIMITS } from '@/features/listing-attributes/schema'
import { getVehicleMakes, getVehicleModels } from '@/features/listing-attributes/vehicle-catalog'
import { VehicleCondition, VehicleFuel, VehicleTransmission } from '@/generated/prisma/enums'
import { type FilterControlProps, FilterRange, FilterSelect, enumOptions } from './filter-controls'
import { useSearchLabels } from './use-search-labels'

export function VehicleFilters({ profile, ...control }: FilterControlProps & { profile: Extract<CategoryAttributeProfile, { kind: 'vehicle' }> }) {
  const { t } = useSearchLabels()
  const makes = getVehicleMakes(profile.vehicleType).map(({ key, label }) => ({ value: key, label: key === 'other' ? t('otherMake') : label }))
  const models = getVehicleModels(control.values.make, profile.vehicleType).map(({ key, label }) => ({
    value: key,
    label: key === 'other' ? t('otherModel') : label
  }))
  const bodies = getVehicleBodyTypes(profile.vehicleType)
  return (
    <fieldset className="min-w-0 space-y-4 border-t pt-5" disabled={control.disabled}>
      <legend className="float-left mb-4 text-sm font-semibold">{t('vehicleDetails')}</legend>
      <div className="clear-both space-y-4">
        <FilterSelect {...control} name="make" searchable options={makes} />
        <FilterSelect
          {...control}
          name="model"
          searchable
          options={models}
          unavailable={!control.values.make}
          placeholder={control.values.make ? t('anyModel') : t('makeFirst')}
        />
        <FilterRange
          {...control}
          label={t('year')}
          from="minYear"
          to="maxYear"
          min={ATTRIBUTE_LIMITS.vehicleYearMin}
          max={Math.min(new Date().getUTCFullYear() + 1, ATTRIBUTE_LIMITS.yearMax)}
        />
        <FilterRange {...control} label={t('mileage')} from="minMileage" to="maxMileage" max={ATTRIBUTE_LIMITS.mileage} />
        <FilterSelect {...control} name="fuel" options={enumOptions(Object.values(VehicleFuel))} />
        <FilterSelect {...control} name="transmission" options={enumOptions(Object.values(VehicleTransmission))} />
        {bodies.length > 0 && <FilterSelect {...control} name="bodyType" options={enumOptions(bodies)} />}
        {control.values.fuel !== 'ELECTRIC' && (
          <FilterRange
            {...control}
            label={t('engineCapacity')}
            from="minEngineCapacity"
            to="maxEngineCapacity"
            min={1}
            max={ATTRIBUTE_LIMITS.engineCapacity}
          />
        )}
        <FilterSelect
          {...control}
          name="seats"
          options={Array.from({ length: profile.vehicleType === 'MOTORCYCLE' ? 2 : ATTRIBUTE_LIMITS.seats }, (_, index) => ({
            value: String(index + 1),
            label: String(index + 1)
          }))}
        />
        <FilterSelect {...control} name="condition" options={enumOptions(Object.values(VehicleCondition))} />
      </div>
    </fieldset>
  )
}
