'use client'

import { Heart, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { setListingFavorite } from './actions'

type FavoriteButtonProps = {
  listingId: string
  title: string
  isFavorited: boolean
  isAuthenticated: boolean
  removalOnly?: boolean
  className?: string
}

export function FavoriteButton({ listingId, title, isFavorited, isAuthenticated, removalOnly = false, className }: FavoriteButtonProps) {
  const router = useRouter()

  const [favorite, setFavorite] = useState(isFavorited)
  const [isPending, startTransition] = useTransition()

  function updateFavorite() {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    const previousFavorite = favorite
    const nextFavorite = removalOnly ? false : !favorite

    setFavorite(nextFavorite)

    startTransition(async () => {
      try {
        const result = await setListingFavorite(listingId, nextFavorite)

        if (!result.success) {
          setFavorite(previousFavorite)

          if ('requiresLogin' in result && result.requiresLogin) {
            router.push('/login')
            return
          }

          toast.add({
            title: 'Could not update favorites',
            description: result.message,
            type: 'error'
          })
        }
      } catch {
        setFavorite(previousFavorite)

        toast.add({
          title: 'Could not update favorites',
          description: 'Check your connection and try again.',
          type: 'error'
        })
      }
    })
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={removalOnly ? 'sm' : 'icon-lg'}
      className={cn(!removalOnly && 'bg-background/95 rounded-full shadow-xs', favorite && 'text-primary', className)}
      aria-label={`${isAuthenticated ? (removalOnly || favorite ? 'Remove from favorites' : 'Add to favorites') : 'Sign in to save listing'}: ${title}`}
      aria-pressed={removalOnly ? undefined : favorite}
      aria-busy={isPending}
      disabled={isPending || (removalOnly && !favorite)}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        updateFavorite()
      }}
    >
      {isPending ? (
        <Loader2 aria-hidden="true" className="motion-safe:animate-spin" />
      ) : (
        <Heart aria-hidden="true" className={cn(favorite && 'fill-current')} />
      )}
      {removalOnly && (isPending ? 'Removing...' : 'Remove favorite')}
    </Button>
  )
}
