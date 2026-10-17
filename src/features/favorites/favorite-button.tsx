'use client'

import { Heart, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { setListingFavorite } from './actions'

export type FavoriteLabels = {
  errors?: Record<string, string>
  add: string
  remove: string
  signIn: string
  removing: string
  removeButton: string
  error: string
  connection: string
}
const defaultLabels: FavoriteLabels = {
  add: 'Add to favorites',
  remove: 'Remove from favorites',
  signIn: 'Sign in to save listing',
  removing: 'Removing...',
  removeButton: 'Remove favorite',
  error: 'Could not update favorites',
  connection: 'Check your connection and try again.'
}

type FavoriteButtonProps = {
  loginHref?: string
  labels?: FavoriteLabels
  listingId: string
  title: string
  isFavorited: boolean
  isAuthenticated: boolean
  removalOnly?: boolean
  className?: string
}

export function FavoriteButton({
  listingId,
  title,
  isFavorited,
  isAuthenticated,
  removalOnly = false,
  className,
  labels = defaultLabels,
  loginHref = '/login'
}: FavoriteButtonProps) {
  const router = useRouter()

  const [favorite, setFavorite] = useState(isFavorited)
  const [isPending, startTransition] = useTransition()

  function updateFavorite() {
    if (!isAuthenticated) {
      router.push(loginHref)
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
            router.push(loginHref)
            return
          }

          toast.add({
            title: labels.error,
            description: labels.errors?.[result.message] ?? (labels === defaultLabels ? result.message : labels.error),
            type: 'error'
          })
        }
      } catch {
        setFavorite(previousFavorite)

        toast.add({
          title: labels.error,
          description: labels.connection,
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
      aria-label={`${isAuthenticated ? (removalOnly || favorite ? labels.remove : labels.add) : labels.signIn}: ${title}`}
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
      {removalOnly && (isPending ? labels.removing : labels.removeButton)}
    </Button>
  )
}
