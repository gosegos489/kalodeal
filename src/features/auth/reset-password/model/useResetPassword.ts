import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from '@/components/ui/toast'
import { authClient } from '@/lib/auth-client'
import { ResetPasswordSchemaTypes, resetPasswordSchema } from './schema'

export const useResetPassword = (token: string) => {
  const router = useRouter()

  const form = useForm<ResetPasswordSchemaTypes>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirm_password: ''
    }
  })

  const isSubmitting = form.formState.isSubmitting

  const onSubmit = form.handleSubmit(async (data) => {
    if (!token) {
      return
    }

    const { error } = await authClient.resetPassword({
      newPassword: data.password,
      token
    })

    if (error) {
      console.error(error)
      return
    }

    router.push('/login')

    toast.add({
      title: 'Password reset successfully',
      type: 'success'
    })
  })

  return {
    form,
    isSubmitting,
    onSubmit
  }
}
