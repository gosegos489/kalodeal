'use client'

import { CopyIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

export function CopyTicketId({ id }: { id: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(id)
      toast.add({ title: 'Ticket ID copied', type: 'success' })
    } catch {
      toast.add({ title: 'Could not copy ticket ID', description: 'Select and copy the ID manually.', type: 'error' })
    }
  }

  return (
    <Button type="button" variant="ghost" size="sm" aria-label="Copy ticket ID" onClick={copy}>
      <CopyIcon aria-hidden="true" />
      Copy
    </Button>
  )
}
