'use client'

import { useTranslations } from 'next-intl'
import { Controller } from 'react-hook-form'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'
import type { CategoryAttributeProfile } from '@/features/listing-attributes/rules'
import { WorkspaceFieldError as FieldError } from '@/shared/ui/workspace-field-error'
import { AttributeSelect, enumOptions } from './attribute-controls'
import type { ListingFormApi } from './types'

export function ListingPriceFields({ form, profile, disabled }: { form: ListingFormApi; profile: CategoryAttributeProfile; disabled: boolean }) {
  const t = useTranslations('Workspace')

  return (
    <div className="grid items-start gap-5 sm:grid-cols-2">
      {profile.kind === 'property' && profile.transaction === 'rent' && (
        <div className="space-y-2">
          <AttributeSelect
            form={form}
            disabled={disabled}
            name="pricePeriod"
            label={t('pricePeriod')}
            options={enumOptions(profile.pricePeriods)}
            placeholder={t('chooseARentalPeriod')}
          />
          <FieldDescription>{t('requiredWhenARentalPriceIsEnteredExistingRentalsCanKeepAnUnknownPeriodUntilTheirPrice')}</FieldDescription>
        </div>
      )}
      <Controller
        name="priceNegotiable"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel
              htmlFor={field.name}
              data-invalid={fieldState.invalid}
              className="data-[invalid=true]:border-destructive has-[:focus-visible]:outline-ring flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 font-normal has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2"
            >
              <span>{t('negotiablePrice')}</span>
              <Switch
                id={field.name}
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
                disabled={disabled}
                aria-invalid={fieldState.invalid}
                aria-describedby={fieldState.error ? `${field.name}-error` : undefined}
              />
            </FieldLabel>
            {fieldState.error && <FieldError id={`${field.name}-error`} errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </div>
  )
}
