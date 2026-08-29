import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from '@/components/ui/toast'
import { authClient } from '@/lib/auth-client'
import { ForgotPasswordSchemaTypes, forgotPasswordSchema } from './schema'

export const useForgotPassword = () => {
  const form = useForm<ForgotPasswordSchemaTypes>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ''
    }
  })

  const isSubmitting = form.formState.isSubmitting

  const onSubmit = form.handleSubmit(async (data) => {
    const { error } = await authClient.requestPasswordReset({
      email: data.email.trim().toLowerCase(),
      redirectTo: '/reset-password'
    })

    if (error) {
      let message = 'Something went wrong'

      if (error.status === 429) {
        message = 'Too many attempts. Please try again later.'
      }

      toast.add({
        title: 'Unable to send reset link',
        description: message,
        type: 'error'
      })

      return
    }

    form.reset()

    toast.add({
      title: 'Check your email',
      description: 'If an account exists with this email, we sent a password reset link.',
      type: 'success'
    })
  })

  return { form, isSubmitting, onSubmit }
}
