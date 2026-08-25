import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { registerSchema } from './schema'

export const useRegister = () => {
  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      confirm_password: ''
    }
  })

  const isSubmitting = registerForm.formState.isSubmitting

  const onSubmit = registerForm.handleSubmit(async (data) => {
    console.log(data)
  })

  return { registerForm, isSubmitting, onSubmit }
}
