'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useTransition } from 'react'
import { toast } from '@/components/ui/toast'
import { DEFAULT_LISTING_CURRENCY } from '@/entities/listing/currency'
import { updateListing } from '@/features/edit-listing/actions'
import type { EditableListing } from '@/features/edit-listing/types'
import type { ListingPlan } from '@/lib/plan-limits'
import { createListing } from './actions'
import { createListingSchema } from './schema'
import type { CreateListingInput, CreateListingValues } from './types'

export function useListingForm(plan: ListingPlan, listing?: EditableListing) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const schema = createListingSchema(plan)
  const form = useForm<CreateListingInput, unknown, CreateListingValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      categoryId: '',
      description: '',
      price: '',
      currency: DEFAULT_LISTING_CURRENCY,
      phone: '',
      youtube: '',
      facebookUrl: '',
      messengerUrl: '',
      ...listing?.values,
      images: []
    }
  })
  const { isSubmitting } = form.formState
  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        const { images, ...details } = values
        const updated = listing ? await updateListing(listing.id, details, listing.updatedAt) : undefined
        const result = updated ?? (await createListing({ images, ...details }))
        if (!result.success) {
          for (const name of schema.keyof().options) {
            const messages = result.fieldErrors?.[name]
            if (messages?.length) form.setError(name, { type: 'server', message: messages.join(' ') })
          }
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
        toast.add({
          title: listing ? 'Could not save listing' : 'Could not publish listing',
          description: 'Check your connection and try again.',
          type: 'error'
        })
      }
    })
  })
  return { form, isSubmitting: isSubmitting || isPending, onSubmit }
}
