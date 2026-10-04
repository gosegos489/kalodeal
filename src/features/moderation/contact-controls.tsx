'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import type { ContactUsStatus } from '@/generated/prisma/enums'
import { changeContactStatus, markContactViewed } from './contact-actions'
import { contactStatusLabels } from './contact-schema'

type Props = { id: string; status: ContactUsStatus; updatedAt: string; unread: boolean }

export function ContactControls({ id, status, updatedAt, unread }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!unread) return
    let active = true
    // Actual mounted detail, not a prefetched RSC, marks the request as read.
    void markContactViewed(id)
      .then((result) => {
        if (!active) return
        if (result.success) startTransition(() => router.refresh())
        else toast.add({ title: 'Could not mark as viewed', description: result.message, type: 'error' })
      })
      .catch(() => {
        if (active) toast.add({ title: 'Could not mark as viewed', description: 'Please try again.', type: 'error' })
      })
    return () => {
      active = false
    }
  }, [id, unread, router])

  function markViewed() {
    startTransition(async () => {
      try {
        const result = await markContactViewed(id)
        if (!result.success) toast.add({ title: 'Could not mark as viewed', description: result.message, type: 'error' })
        router.refresh()
      } catch {
        toast.add({ title: 'Could not mark as viewed', description: 'Please try again.', type: 'error' })
      }
    })
  }

  function update(nextStatus: ContactUsStatus) {
    startTransition(async () => {
      try {
        const result = await changeContactStatus({ id, status: nextStatus, updatedAt })
        toast.add({
          title: result.success ? 'Status updated' : 'Could not update status',
          description: result.message,
          type: result.success ? 'success' : 'error'
        })
        // Expected conflicts/deletions also refresh the server's current state.
        router.refresh()
      } catch {
        toast.add({ title: 'Could not update status', description: 'Please try again.', type: 'error' })
      }
    })
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Change status</p>
      <div className="flex flex-wrap gap-2">
        {(['OPEN', 'IN_PROGRESS', 'CLOSED'] as const).map((value) => (
          <Button
            key={value}
            variant={status === value ? 'default' : 'outline'}
            disabled={pending || unread || status === value}
            onClick={() => update(value)}
          >
            {contactStatusLabels[value]}
          </Button>
        ))}
        {unread && (
          <Button variant="outline" disabled={pending} onClick={markViewed}>
            Mark as viewed / retry
          </Button>
        )}
      </div>
      <p aria-live="polite" className="text-muted-foreground text-sm">
        {pending
          ? 'Updating request…'
          : unread
            ? 'Marking this request as viewed. Retry if it stays unread.'
            : 'Viewing a request does not change its status.'}
      </p>
    </div>
  )
}
