'use client'

import { CheckCheck, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { type OwnerListingAction, getOwnerStatusTransition } from '@/entities/listing/lifecycle'
import type { ListingStatus } from '@/generated/prisma/enums'
import { createWorkspaceCopy } from '@/i18n/workspace-copy'
import { changeListingVisibility } from './listing-actions'

export function ListingOwnerActions({ id, title, status, updatedAt }: { id: string; title: string; status: ListingStatus; updatedAt: string }) {
  const t = useTranslations('Workspace')
  const copy = createWorkspaceCopy(t)

  const router = useRouter()
  const inFlight = useRef(false)
  const [pending, startTransition] = useTransition()
  const [pendingAction, setPendingAction] = useState<OwnerListingAction | null>(null)
  const [soldOpen, setSoldOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const visibilityAction = status === 'ACTIVE' ? 'hide' : status === 'INACTIVE' ? 'unhide' : null
  const canMarkSold = getOwnerStatusTransition(status, 'mark-sold') !== null
  if (!visibilityAction && !canMarkSold) return null

  function submit(action: OwnerListingAction) {
    if (inFlight.current) return
    inFlight.current = true
    setPendingAction(action)
    setError(null)
    startTransition(async () => {
      try {
        const result = await changeListingVisibility({ id, updatedAt, action })
        if (result.success) setSoldOpen(false)
        else setError(copy(result.message, true))
        toast.add({
          title: result.success ? t('listingUpdated') : t('couldNotUpdateListing'),
          description: copy(result.message, true),
          type: result.success ? 'success' : 'error'
        })
      } catch {
        const message = t('couldNotConfirmThisChangeReloadToCheckYourListingBeforeRetrying')
        setError(message)
        toast.add({ title: t('couldNotUpdateListing'), description: message, type: 'error' })
      } finally {
        router.refresh()
        setPendingAction(null)
        inFlight.current = false
      }
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {visibilityAction && (
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            aria-busy={pendingAction === visibilityAction}
            aria-label={`${visibilityAction === 'hide' ? t('hide') : t('unhide')} listing: ${title}`}
            onClick={() => submit(visibilityAction)}
          >
            {pendingAction === visibilityAction ? (
              <Loader2 aria-hidden="true" className="motion-safe:animate-spin" />
            ) : visibilityAction === 'hide' ? (
              <EyeOff aria-hidden="true" />
            ) : (
              <Eye aria-hidden="true" />
            )}
            {pendingAction === visibilityAction ? t('updating') : visibilityAction === 'hide' ? t('hide') : t('unhide')}
          </Button>
        )}
        {canMarkSold && (
          <AlertDialog
            open={soldOpen}
            onOpenChange={(open) => {
              if (!pending) {
                setSoldOpen(open)
                setError(null)
              }
            }}
          >
            <AlertDialogTrigger
              render={<Button variant="outline" size="sm" disabled={pending} />}
              aria-label={t('markAsSoldValue', { value0: title })}
            >
              <CheckCheck aria-hidden="true" /> {t('markAsSold')}
            </AlertDialogTrigger>
            <AlertDialogContent className="w-[calc(100vw-2rem)]" aria-busy={pending}>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('markThisListingAsSold')}</AlertDialogTitle>
                <AlertDialogDescription className="wrap-anywhere">
                  &ldquo;{title}
                  {t('willLeavePublicBrowsingSoldListingsCannotBeUnhidden')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              {error && (
                <p role="alert" className="text-destructive text-sm">
                  {error}
                </p>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={pending}>{t('cancel')}</AlertDialogCancel>
                <AlertDialogAction disabled={pending} onClick={() => submit('mark-sold')}>
                  {pending && <Loader2 aria-hidden="true" className="motion-safe:animate-spin" />}
                  {pending ? t('updating') : t('markAsSold')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      {error && !soldOpen && (
        <p role="alert" className="text-destructive max-w-xs text-xs">
          {error}
        </p>
      )}
    </div>
  )
}
