import { Plus } from 'lucide-react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function ActionButtons() {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Link className={cn(buttonVariants({ variant: 'ghost' }), 'hidden h-10 px-3 text-sm font-medium sm:inline-flex')} href="/login">
        Sign in
      </Link>
      <Link href="/sell" className={cn(buttonVariants(), 'h-10 rounded-lg px-3 text-sm font-semibold sm:px-4')}>
        <Plus className="size-4 shrink-0" strokeWidth={2} />
        <span className="hidden sm:inline">Post a listing</span>
        <span className="sm:hidden">Post</span>
      </Link>
    </div>
  )
}
