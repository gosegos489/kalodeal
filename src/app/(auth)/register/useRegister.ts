import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from '@/components/ui/toast'
import { authClient } from '@/lib/auth-client'
import { RegisterSchemaTypes, registerSchema } from './schema'

export const useRegister = () => {
  const router = useRouter()

  const registerForm = useForm<RegisterSchemaTypes>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirm_password: ''
    }
  })

  const isSubmitting = registerForm.formState.isSubmitting

  const onSubmit = registerForm.handleSubmit(async (data) => {
    const { name, email, password } = data

    const { error } = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      callbackURL: '/'
    })

    if (error) {
      let message = 'Something went wrong'

      if (error.status === 429) {
        message = 'Too many attempts. Please try again later.'
      } else if (error.code === 'USER_ALREADY_EXISTS') {
        message = 'An account with this email already exists.'
      } else if (error.message) {
        message = error.message
      }

      toast.add({
        title: 'Registration failed',
        description: message,
        type: 'error'
      })

      return
    }

    registerForm.reset()

    toast.add({
      title: 'Check your email',
      description: 'Please check your email to verify your account.',
      type: 'success'
    })

    router.push('/')
  })

  return { registerForm, isSubmitting, onSubmit }
}
