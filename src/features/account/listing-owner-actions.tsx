'use client'

import { CheckCheck, Eye, EyeOff, Loader2 } from 'lucide-react'
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
import { changeListingVisibility } from './listing-actions'

export function ListingOwnerActions({ id, title, status, updatedAt }: { id: string; title: string; status: ListingStatus; updatedAt: string }) {
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
        else setError(result.message)
        toast.add({
          title: result.success ? 'Listing updated' : 'Could not update listing',
          description: result.message,
          type: result.success ? 'success' : 'error'
        })
      } catch {
        const message = 'Could not confirm this change. Reload to check your listing before retrying.'
        setError(message)
        toast.add({ title: 'Could not update listing', description: message, type: 'error' })
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
            aria-label={`${visibilityAction === 'hide' ? 'Hide' : 'Unhide'} listing: ${title}`}
            onClick={() => submit(visibilityAction)}
          >
            {pendingAction === visibilityAction ? (
              <Loader2 aria-hidden="true" className="motion-safe:animate-spin" />
            ) : visibilityAction === 'hide' ? (
              <EyeOff aria-hidden="true" />
            ) : (
              <Eye aria-hidden="true" />
            )}
            {pendingAction === visibilityAction ? 'Updating...' : visibilityAction === 'hide' ? 'Hide' : 'Unhide'}
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
            <AlertDialogTrigger render={<Button variant="outline" size="sm" disabled={pending} />} aria-label={`Mark as sold: ${title}`}>
              <CheckCheck aria-hidden="true" /> Mark as sold
            </AlertDialogTrigger>
            <AlertDialogContent className="w-[calc(100vw-2rem)]" aria-busy={pending}>
              <AlertDialogHeader>
                <AlertDialogTitle>Mark this listing as sold?</AlertDialogTitle>
                <AlertDialogDescription className="wrap-anywhere">
                  &ldquo;{title}&rdquo; will leave public browsing. Sold listings cannot be unhidden.
                </AlertDialogDescription>
              </AlertDialogHeader>
              {error && (
                <p role="alert" className="text-destructive text-sm">
                  {error}
                </p>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
                <AlertDialogAction disabled={pending} onClick={() => submit('mark-sold')}>
                  {pending && <Loader2 aria-hidden="true" className="motion-safe:animate-spin" />}
                  {pending ? 'Updating...' : 'Mark as sold'}
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
