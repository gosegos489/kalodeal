import { Skeleton } from '@/components/ui/skeleton'
import { LoadingStatus } from '@/shared/ui/loading-status'

type Variant = 'login' | 'register' | 'forgot' | 'reset'
const labels = {
  login: 'Loading sign-in form',
  register: 'Loading sign-up form',
  forgot: 'Loading password recovery form',
  reset: 'Loading password reset form'
}

export function AuthFieldsSkeleton({ variant, label = labels[variant] }: { variant: Variant; label?: string }) {
  return (
    <LoadingStatus label={label} className="flex flex-col items-center gap-6">
      {variant === 'register' && (
        <div className="w-full space-y-3">
          <div className="grid grid-cols-2 gap-1">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
          <Skeleton className="h-5 w-4/5" />
        </div>
      )}
      <div className="flex w-full flex-col gap-6">
        {Array.from({ length: variant === 'register' ? 4 : variant === 'forgot' ? 1 : 2 }, (_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-9 w-full max-w-50" />
    </LoadingStatus>
  )
}

export function AuthFormSkeleton({ variant, label }: { variant: Variant; label?: string }) {
  return (
    <div className="bg-card mx-auto flex w-full flex-col gap-6 rounded-xl border p-6 shadow-sm sm:p-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5 sm:hidden" />
      </div>
      <AuthFieldsSkeleton variant={variant} label={label} />
      <div className="flex flex-col items-center gap-2">
        <Skeleton className="h-5 w-3/4" />
        {variant === 'login' && <Skeleton className="h-5 w-4/5" />}
      </div>
    </div>
  )
}
