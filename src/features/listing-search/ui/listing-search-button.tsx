import { Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ListingSearchButtonProps = { isPending: boolean }

export function ListingSearchButton({ isPending }: ListingSearchButtonProps) {
  const Icon = isPending ? Loader2 : Search

  return (
    <Button type="submit" size="lg" className="h-12 w-full px-6 sm:w-32 sm:shrink-0" disabled={isPending}>
      <Icon aria-hidden="true" className={cn('size-4', isPending && 'motion-safe:animate-spin')} />
      {isPending ? 'Searching...' : 'Search'}
    </Button>
  )
}
