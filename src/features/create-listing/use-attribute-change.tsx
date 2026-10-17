'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { hasEnteredAttributeLoss } from '@/features/listing-attributes/category-change'
import type { ListingAttributes } from '@/features/listing-attributes/schema'
import { fillAttributeFormDefaults, normalizeEmptyFormDetails } from './form-values'
import type { ListingFormApi } from './types'

export function getFormAttributes(form: ListingFormApi): ListingAttributes {
  const normalized = normalizeEmptyFormDetails({
    propertyDetails: form.getValues('propertyDetails'),
    vehicleDetails: form.getValues('vehicleDetails')
  })
  const property = normalized.propertyDetails
  return {
    priceNegotiable: form.getValues('priceNegotiable') ?? false,
    pricePeriod: form.getValues('pricePeriod') ?? null,
    propertyDetails: property ? { ...property, amenities: property.amenities ?? [] } : null,
    vehicleDetails: normalized.vehicleDetails ?? null
  }
}

export function useAttributeChange(form: ListingFormApi) {
  const t = useTranslations('Workspace')

  const [pending, setPending] = useState<{ attributes: ListingAttributes; categoryId?: string } | null>(null)
  const apply = (attributes: ListingAttributes, categoryId?: string) => {
    const next = fillAttributeFormDefaults(attributes)
    if (categoryId !== undefined) form.setValue('categoryId', categoryId, { shouldDirty: true })
    form.setValue('propertyDetails', next.propertyDetails, { shouldDirty: true })
    form.setValue('vehicleDetails', next.vehicleDetails, { shouldDirty: true })
    form.setValue('pricePeriod', attributes.pricePeriod, { shouldDirty: true })
    form.clearErrors(['categoryId', 'propertyDetails', 'vehicleDetails', 'pricePeriod'])
    if (form.formState.isSubmitted) void form.trigger()
  }
  const requestChange = (attributes: ListingAttributes, removedFields: string[], categoryId?: string) => {
    if (hasEnteredAttributeLoss(getFormAttributes(form), removedFields)) setPending({ attributes, categoryId })
    else apply(attributes, categoryId)
  }
  const dialog = (
    <AlertDialog
      open={pending !== null}
      onOpenChange={(open) => {
        if (!open) setPending(null)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('changeListingType')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('someEnteredDetailsDoNotApplyToThisSelectionAndWillBeClearedYourTitleDescriptionLocati')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('keepCurrentSelection')}</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            onClick={() => {
              if (pending) apply(pending.attributes, pending.categoryId)
              setPending(null)
            }}
          >
            {t('changeAndClearDetails')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
  return { requestChange, dialog }
}
