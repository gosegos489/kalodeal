'use client'

import { useTranslations } from 'next-intl'
import { useWatch } from 'react-hook-form'
import { getVehicleBodyTypes, getVehicleFields } from '@/features/listing-attributes/rules'
import { ATTRIBUTE_LIMITS } from '@/features/listing-attributes/schema'
import { OTHER_VEHICLE_MAKE, OTHER_VEHICLE_MODEL, getVehicleMakes, getVehicleModels } from '@/features/listing-attributes/vehicle-catalog'
import { selectVehicleMake } from '@/features/listing-attributes/vehicle-selection'
import { VehicleColor, VehicleCondition, VehicleFuel, VehicleTransmission, type VehicleType } from '@/generated/prisma/enums'
import { WorkspaceFieldError as FieldError } from '@/shared/ui/workspace-field-error'
import { AttributeNumber, AttributeSelect, AttributeText, enumOptions } from './attribute-controls'
import type { ListingFormApi } from './types'

export function VehicleFields({ form, vehicleType, disabled }: { form: ListingFormApi; vehicleType: VehicleType; disabled: boolean }) {
  const t = useTranslations('Workspace')

  const vehicle = useWatch({ control: form.control, name: 'vehicleDetails' })
  const fields = getVehicleFields(vehicleType)
  const ensureVehicle = () => {
    if (!form.getValues('vehicleDetails')?.vehicleType) form.setValue('vehicleDetails', { vehicleType }, { shouldDirty: true })
  }
  const control = { form, disabled, beforeChange: ensureVehicle }
  const bodies = getVehicleBodyTypes(vehicleType)
  return (
    <section className="bg-card flex min-w-0 flex-col gap-6 rounded-2xl border p-5 shadow-xs sm:p-7" aria-labelledby="vehicle-heading">
      <div className="space-y-1 border-b pb-5">
        <h2 id="vehicle-heading" className="text-lg font-semibold">
          {vehicleType === 'MOTORCYCLE' ? t('motorcycleDetails') : vehicleType === 'VAN' ? t('vanDetails') : t('carDetails')}
        </h2>
        <p className="text-muted-foreground text-sm">{t('addTheCharacteristicsYouKnowChooseOtherIfYourMakeOrModelIsMissing')}</p>
      </div>
      <div className="grid min-w-0 gap-5 sm:grid-cols-2">
        <AttributeSelect
          {...control}
          name="vehicleDetails.make"
          label={t('make')}
          searchable
          options={getVehicleMakes(vehicleType).map(({ key, label }) => ({ value: key, label }))}
          onChange={(make) => {
            const current = form.getValues('vehicleDetails') ?? { vehicleType }
            form.setValue('vehicleDetails', selectVehicleMake(current, make), { shouldDirty: true, shouldValidate: form.formState.isSubmitted })
            form.clearErrors(['vehicleDetails.model', 'vehicleDetails.otherMake', 'vehicleDetails.otherModel'])
          }}
        />
        <AttributeSelect
          {...control}
          disabled={disabled || !vehicle?.make}
          name="vehicleDetails.model"
          label={t('model')}
          searchable
          options={getVehicleModels(vehicle?.make ?? '', vehicleType).map(({ key, label }) => ({ value: key, label }))}
          onChange={(model) => {
            const current = form.getValues('vehicleDetails') ?? { vehicleType }
            form.setValue(
              'vehicleDetails',
              { ...current, model, otherModel: model === OTHER_VEHICLE_MODEL ? current.otherModel : null },
              { shouldDirty: true, shouldValidate: form.formState.isSubmitted }
            )
          }}
        />
        {vehicle?.make === OTHER_VEHICLE_MAKE && (
          <AttributeText {...control} name="vehicleDetails.otherMake" label={t('makeNameRequiredForOtherMake')} maxLength={60} />
        )}
        {vehicle?.model === OTHER_VEHICLE_MODEL && (
          <AttributeText {...control} name="vehicleDetails.otherModel" label={t('modelNameRequiredForOtherModel')} maxLength={80} />
        )}
        <AttributeNumber
          {...control}
          name="vehicleDetails.year"
          label={t('year')}
          min={ATTRIBUTE_LIMITS.vehicleYearMin}
          max={Math.min(new Date().getUTCFullYear() + 1, ATTRIBUTE_LIMITS.yearMax)}
        />
        <AttributeNumber {...control} name="vehicleDetails.mileage" label={t('mileageKm')} max={ATTRIBUTE_LIMITS.mileage} />
        <AttributeSelect
          {...control}
          name="vehicleDetails.fuel"
          label={t('fuelType')}
          options={enumOptions(Object.values(VehicleFuel))}
          onChange={(fuel) => {
            form.setValue('vehicleDetails.fuel', Object.values(VehicleFuel).find((value) => value === fuel) ?? null, {
              shouldDirty: true,
              shouldValidate: form.formState.isSubmitted
            })
            if (fuel === 'ELECTRIC') {
              form.setValue('vehicleDetails.engineCapacity', null, { shouldDirty: true })
              form.clearErrors('vehicleDetails.engineCapacity')
            }
          }}
        />
        <AttributeSelect
          {...control}
          name="vehicleDetails.transmission"
          label={t('transmission')}
          options={enumOptions(Object.values(VehicleTransmission))}
        />
        {fields.includes('bodyType') && (
          <AttributeSelect {...control} name="vehicleDetails.bodyType" label={t('bodyType')} options={enumOptions(bodies)} />
        )}
        {vehicle?.fuel !== 'ELECTRIC' && (
          <AttributeNumber
            {...control}
            name="vehicleDetails.engineCapacity"
            label={t('engineCapacityCm')}
            min={1}
            max={ATTRIBUTE_LIMITS.engineCapacity}
          />
        )}
        <AttributeNumber
          {...control}
          name="vehicleDetails.seats"
          label={t('seats')}
          min={1}
          max={vehicleType === 'MOTORCYCLE' ? 2 : ATTRIBUTE_LIMITS.seats}
        />
        {fields.includes('doors') && (
          <AttributeNumber {...control} name="vehicleDetails.doors" label={t('doors')} min={1} max={ATTRIBUTE_LIMITS.doors} />
        )}
        <AttributeSelect {...control} name="vehicleDetails.condition" label={t('condition')} options={enumOptions(Object.values(VehicleCondition))} />
        <AttributeSelect {...control} name="vehicleDetails.color" label={t('color')} options={enumOptions(Object.values(VehicleColor))} />
      </div>
      {form.formState.errors.vehicleDetails?.message && <FieldError errors={[form.formState.errors.vehicleDetails]} />}
      {form.formState.errors.vehicleDetails?.vehicleType && <FieldError errors={[form.formState.errors.vehicleDetails.vehicleType]} />}
    </section>
  )
}
