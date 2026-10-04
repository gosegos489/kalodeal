'use client'

import { CheckIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import type { ContactUsStatus } from '@/generated/prisma/enums'
import { changeContactStatus } from './contact-actions'
import { contactStatusLabels } from './contact-schema'

type Props = { id: string; status: ContactUsStatus; updatedAt: string }

export function ContactControls({ id, status, updatedAt }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function update(nextStatus: ContactUsStatus) {
    startTransition(async () => {
      try {
        const result = await changeContactStatus({ id, status: nextStatus, updatedAt })
        toast.add({
          title: result.success ? 'Status updated' : 'Could not update status',
          description: result.message,
          type: result.success ? 'success' : 'error'
        })
        if (!result.success) router.refresh()
      } catch {
        toast.add({ title: 'Could not update status', description: 'Please try again.', type: 'error' })
      }
    })
  }

  return (
    <section aria-labelledby="contact-status-heading" className="space-y-3">
      <h3 id="contact-status-heading" className="text-sm font-medium">
        Status
      </h3>
      <p className="text-muted-foreground text-sm">
        Current status: <span className="text-foreground font-medium">{contactStatusLabels[status]}</span>
      </p>
      <div role="group" aria-label="Change request status" className="flex flex-wrap gap-2">
        {(['OPEN', 'IN_PROGRESS', 'CLOSED'] as const).map((value) => (
          <Button
            key={value}
            variant={status === value ? 'default' : 'outline'}
            className={status === value ? 'disabled:opacity-100' : undefined}
            aria-pressed={status === value}
            disabled={pending || status === value}
            onClick={() => update(value)}
          >
            {status === value && <CheckIcon aria-hidden="true" />}
            {contactStatusLabels[value]}
          </Button>
        ))}
      </div>
      <p aria-live="polite" className="text-muted-foreground text-sm">
        {pending ? 'Updating request…' : null}
      </p>
    </section>
  )
}
