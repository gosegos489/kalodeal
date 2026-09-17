'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from '@/components/ui/toast'
import type { ListingPlan } from '@/lib/plan-limits'
import { createListing } from './actions'
import { createListingSchema } from './schema'
import type { CreateListingInput, CreateListingValues } from './types'

export function useCreateListing(plan: ListingPlan) {
  const router = useRouter()
  const form = useForm<CreateListingInput, unknown, CreateListingValues>({
    resolver: zodResolver(createListingSchema(plan)),
    defaultValues: { title: '', categoryId: '', description: '', price: '', phone: '', youtube: '', images: [] }
  })
  const { isSubmitting } = form.formState
  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const result = await createListing(values)
      if (!result.success) {
        const names = ['title', 'categoryId', 'description', 'price', 'phone', 'youtube', 'images'] as const
        for (const name of names) {
          const messages = result.fieldErrors?.[name]
          if (messages?.length) form.setError(name, { type: 'server', message: messages.join(' ') })
        }
        toast.add({ title: 'Could not publish listing', description: result.message, type: 'error' })
        router.refresh()
        return
      }
      form.reset()
      toast.add({ title: 'Listing published', description: 'Your listing is now available to buyers.', type: 'success' })
      router.refresh()
    } catch {
      toast.add({ title: 'Could not publish listing', description: 'Check your connection and try again.', type: 'error' })
    }
  })
  return { form, isSubmitting, onSubmit }
}
