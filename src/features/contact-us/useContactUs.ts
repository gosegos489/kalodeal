'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from '@/components/ui/toast'
import { createContactUs } from './action'
import { contactUsSchema } from './schema'
import type { ContactUsSchemaTypes } from './types'

export const useContactUs = () => {
  const form = useForm<ContactUsSchemaTypes>({
    resolver: zodResolver(contactUsSchema),
    defaultValues: {
      contactEmail: '',
      question: 'GENERAL',
      message: ''
    }
  })

  const { isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async (values) => {
    let result
    try {
      result = await createContactUs(values)
    } catch {
      toast.add({ title: 'Error', description: 'Could not submit your message. Please try again.', type: 'error' })
      return
    }

    if (result.success) {
      form.reset()

      toast.add({
        title: 'Success',
        description: result.message,
        type: 'success'
      })

      return
    }
    toast.add({
      title: 'Error',
      description: result.message,
      type: 'error'
    })
  })

  return {
    form,
    isSubmitting,
    onSubmit
  }
}
