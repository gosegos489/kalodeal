import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function LoadingStatus({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div role="status" className={cn('min-w-0', className)}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}
