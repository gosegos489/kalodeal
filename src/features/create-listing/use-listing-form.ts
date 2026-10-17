'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { type FieldPath, useForm } from 'react-hook-form'
import { useState, useTransition } from 'react'
import { toast } from '@/components/ui/toast'
import { DEFAULT_LISTING_CURRENCY } from '@/entities/listing/currency'
import { updateListing } from '@/features/edit-listing/actions'
import type { EditableListing } from '@/features/edit-listing/types'
import { propertyDetailsSchema, vehicleDetailsSchema } from '@/features/listing-attributes/schema'
import { localizeHref } from '@/i18n/routing'
import { createWorkspaceCopy } from '@/i18n/workspace-copy'
import type { ListingPlan } from '@/lib/plan-limits'
import { createListing } from './actions'
import { normalizeEmptyFormDetails } from './form-values'
import { createListingSchema } from './schema'
import type { CreateListingInput, CreateListingValues, ListingCategoryOption } from './types'
import { validateListingCategoryAttributes } from './validation'

export function useListingForm(plan: ListingPlan, categories: ListingCategoryOption[], listing?: EditableListing) {
  const locale = useLocale()

  const t = useTranslations('Workspace')
  const copy = createWorkspaceCopy(t)

  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const baseSchema = createListingSchema(plan, listing?.values.messengerUrl)
  const schema = baseSchema.superRefine((values, ctx) => {
    const category = categories.find((item) => item.id === values.categoryId)
    if (!category) {
      ctx.addIssue({ code: 'custom', path: ['categoryId'], message: 'Choose an available category.' })
      return
    }
    const attributes = validateListingCategoryAttributes(category.slug, values, listing?.values)
    if (!attributes.success) for (const issue of attributes.error.issues) ctx.addIssue({ ...issue })
  })
  const form = useForm<CreateListingInput, unknown, CreateListingValues>({
    resolver: (values, context, options) => zodResolver(schema)(normalizeEmptyFormDetails(values), context, options),
    defaultValues: {
      title: '',
      categoryId: '',
      district: '',
      area: '',
      description: '',
      price: '',
      currency: DEFAULT_LISTING_CURRENCY,
      phone: '',
      youtube: '',
      facebookUrl: '',
      messengerUrl: '',
      priceNegotiable: false,
      pricePeriod: null,
      propertyDetails: null,
      vehicleDetails: null,
      ...listing?.values,
      images: []
    }
  })
  const { isSubmitting } = form.formState
  const onSubmit = form.handleSubmit(
    (values) => {
      setSubmissionError(null)
      startTransition(async () => {
        try {
          const { images, ...details } = values
          const updated = listing ? await updateListing(listing.id, details, listing.updatedAt) : undefined
          const result = updated ?? (await createListing({ images, ...details }))
          if (!result.success) {
            const paths = new Set<string>([
              ...baseSchema.keyof().options,
              ...propertyDetailsSchema.keyof().options.map((key) => `propertyDetails.${key}`),
              ...vehicleDetailsSchema.keyof().options.map((key) => `vehicleDetails.${key}`)
            ])
            let focused = false
            for (const [name, messages] of Object.entries(result.fieldErrors ?? {})) {
              if (paths.has(name) && messages.length) {
                form.setError(name as FieldPath<CreateListingInput>, { type: 'server', message: messages.join(' ') }, { shouldFocus: !focused })
                focused = true
              }
            }
            setSubmissionError(copy(result.message, true))
            toast.add({
              title: listing ? t('couldNotSaveListing') : t('couldNotPublishListing'),
              description: copy(result.message, true),
              type: 'error'
            })
            if (!listing) router.refresh()
            return
          }
          if (updated?.success) {
            toast.add({
              title: updated.data.changed ? t('listingUpdated') : t('noChangesToSave'),
              description:
                updated.data.status === 'PENDING'
                  ? t('yourListingIsAwaitingModerationYouCanViewItInMyListings')
                  : t('yourListingStatusIsUnchangedYouCanViewItInMyListings'),
              type: 'success'
            })
            router.push(localizeHref('/account/listings', locale))
          } else {
            form.reset()
            toast.add({
              title: t('listingSubmitted'),
              description: t('yourListingIsAwaitingModerationYouCanViewItInMyListings'),
              type: 'success'
            })
          }
          router.refresh()
        } catch {
          setSubmissionError(t('checkYourConnectionAndTryAgain'))
          toast.add({
            title: listing ? t('couldNotSaveListing') : t('couldNotPublishListing'),
            description: t('checkYourConnectionAndTryAgain'),
            type: 'error'
          })
        }
      })
    },
    () => setSubmissionError(t('pleaseCheckTheHighlightedFieldsBeforeSubmitting'))
  )
  return { form, isSubmitting: isSubmitting || isPending, onSubmit, submissionError }
}
