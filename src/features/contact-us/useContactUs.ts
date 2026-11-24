'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { toast } from '@/components/ui/toast'
import { createContactUs } from './action'
import { createContactUsSchema } from './schema'
import type { ContactUsSchemaTypes } from './types'

export const useContactUs = () => {
  const t = useTranslations('ContactUs')
  const form = useForm<ContactUsSchemaTypes>({
    resolver: zodResolver(
      createContactUsSchema({
        emailInvalid: t('validation.emailInvalid'),
        emailTooLong: t('validation.emailTooLong'),
        topicInvalid: t('validation.topicInvalid'),
        messageTooShort: t('validation.messageTooShort'),
        messageTooLong: t('validation.messageTooLong')
      })
    ),
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
      toast.add({ title: t('feedback.error'), description: t('feedback.failed'), type: 'error' })
      return
    }

    if (result.success) {
      form.reset()

      toast.add({
        title: t('feedback.success'),
        description: t('feedback.submitted'),
        type: 'success'
      })

      return
    }
    toast.add({
      title: t('feedback.error'),
      description: t(`feedback.${result.code}`),
      type: 'error'
    })
  })

  return {
    form,
    isSubmitting,
    onSubmit
  }
}
