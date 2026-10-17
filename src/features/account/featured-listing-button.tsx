'use client'

import { Loader2, Star } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { createWorkspaceCopy } from '@/i18n/workspace-copy'
import { featureListing } from './featured-listing'

export function FeaturedListingButton({ id, title, selected, eligible }: { id: string; title: string; selected: boolean; eligible: boolean }) {
  const t = useTranslations('Workspace')
  const copy = createWorkspaceCopy(t)

  const router = useRouter()
  const inFlight = useRef(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  if (!eligible && !selected) return null
  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        aria-pressed={selected}
        aria-label={t('featuredListingValue', { value0: title })}
        onClick={() => {
          if (inFlight.current) return
          inFlight.current = true
          setError(null)
          startTransition(async () => {
            try {
              const result = await featureListing({ id, selected: !selected })
              if (!result.success) setError(copy(result.message, true))
              toast.add({
                title: result.success ? t('featuredListingUpdated') : t('couldNotUpdateFeaturedListing'),
                description: copy(result.message, true),
                type: result.success ? 'success' : 'error'
              })
            } catch {
              setError(t('couldNotUpdateFeaturedListingPleaseTryAgain'))
            } finally {
              inFlight.current = false
              router.refresh()
            }
          })
        }}
      >
        {pending ? <Loader2 aria-hidden="true" className="motion-safe:animate-spin" /> : <Star aria-hidden="true" />}
        {selected ? t('removeFeaturedListing') : t('featuredListing')}
      </Button>
      {error && (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  )
}
