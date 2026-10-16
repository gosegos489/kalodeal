'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { type FieldPath, useForm } from 'react-hook-form'
import { useState, useTransition } from 'react'
import { toast } from '@/components/ui/toast'
import { DEFAULT_LISTING_CURRENCY } from '@/entities/listing/currency'
import { updateListing } from '@/features/edit-listing/actions'
import type { EditableListing } from '@/features/edit-listing/types'
import { propertyDetailsSchema, vehicleDetailsSchema } from '@/features/listing-attributes/schema'
import type { ListingPlan } from '@/lib/plan-limits'
import { createListing } from './actions'
import { normalizeEmptyFormDetails } from './form-values'
import { createListingSchema } from './schema'
import type { CreateListingInput, CreateListingValues, ListingCategoryOption } from './types'
import { validateListingCategoryAttributes } from './validation'

export function useListingForm(plan: ListingPlan, categories: ListingCategoryOption[], listing?: EditableListing) {
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
            setSubmissionError(result.message)
            toast.add({ title: listing ? 'Could not save listing' : 'Could not publish listing', description: result.message, type: 'error' })
            if (!listing) router.refresh()
            return
          }
          if (updated?.success) {
            toast.add({
              title: updated.data.changed ? 'Listing updated' : 'No changes to save',
              description:
                updated.data.status === 'PENDING'
                  ? 'Your listing is awaiting moderation. You can view it in My listings.'
                  : 'Your listing status is unchanged. You can view it in My listings.',
              type: 'success'
            })
            router.push('/account/listings')
          } else {
            form.reset()
            toast.add({
              title: 'Listing submitted',
              description: 'Your listing is awaiting moderation. You can view it in My listings.',
              type: 'success'
            })
          }
          router.refresh()
        } catch {
          setSubmissionError('Check your connection and try again.')
          toast.add({
            title: listing ? 'Could not save listing' : 'Could not publish listing',
            description: 'Check your connection and try again.',
            type: 'error'
          })
        }
      })
    },
    () => setSubmissionError('Please check the highlighted fields before submitting.')
  )
  return { form, isSubmitting: isSubmitting || isPending, onSubmit, submissionError }
}
