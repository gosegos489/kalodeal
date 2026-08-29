import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from '@/components/ui/toast'
import { authClient } from '@/lib/auth-client'
import { LoginSchemaTypes, loginSchema } from './schema'

export const useLogin = () => {
  const form = useForm<LoginSchemaTypes>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const isSubmitting = form.formState.isSubmitting

  const onSubmit = form.handleSubmit(async (data) => {
    const { email, password } = data

    const { error } = await authClient.signIn.email({
      email: email.trim().toLowerCase(),
      password,
      callbackURL: '/'
    })

    if (error) {
      let message = 'Something went wrong'

      if (error.status === 429) {
        message = 'Too many attempts. Please try again later.'
      } else if (error.status === 403) {
        message = 'Please verify your email address.'
      } else if (error.message) {
        message = error.message
      }

      toast.add({
        title: 'Login failed',
        description: message,
        type: 'error'
      })

      return
    }
  })

  return {
    form,
    isSubmitting,
    onSubmit
  }
}
