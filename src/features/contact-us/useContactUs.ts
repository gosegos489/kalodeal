'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
    const result = await createContactUs(values)

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
