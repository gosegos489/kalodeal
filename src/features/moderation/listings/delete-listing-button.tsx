'use client'

import { Loader2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
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
import { deleteModeratedListing } from './delete-listing'

export function ModeratorDeleteListingButton({ listingId }: { listingId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      try {
        const result = await deleteModeratedListing(listingId)
        if (!result.success) {
          if (result.unavailable) {
            setOpen(false)
            toast.add({ title: result.message, type: 'error' })
            router.refresh()
          } else {
            setError(result.message)
            toast.add({ title: 'Could not delete listing', description: result.message, type: 'error' })
          }
          return
        }
        setOpen(false)
        toast.add({ title: result.message, description: result.warning, type: 'success' })
        router.refresh()
      } catch {
        const message = 'Could not delete this listing. Check your connection and try again.'
        setError(message)
        toast.add({ title: 'Could not delete listing', description: message, type: 'error' })
      }
    })
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isPending) return
        setOpen(nextOpen)
        setError(null)
      }}
    >
      <AlertDialogTrigger
        render={<Button variant="outline" size="icon" className="text-muted-foreground hover:text-destructive size-11 sm:size-8" />}
        aria-label="Delete listing permanently"
        title="Delete listing permanently"
        disabled={isPending}
      >
        <X aria-hidden="true" />
      </AlertDialogTrigger>
      <AlertDialogContent className="w-[calc(100vw-2rem)]" aria-busy={isPending}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete listing permanently?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The listing and its related stored data will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={isPending} onClick={handleDelete}>
            {isPending && <Loader2 aria-hidden="true" className="motion-safe:animate-spin" />}
            {isPending ? 'Deleting...' : 'Delete permanently'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
