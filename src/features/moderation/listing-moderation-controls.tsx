'use client'

import { Check, LoaderCircle, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import type { ActionMessageResult } from '@/lib/action-result'
import { moderateListing } from './actions'

export function ListingModerationControls({ id, updatedAt }: { id: string; updatedAt: string }) {
  const router = useRouter()
  const [pendingDecision, setPendingDecision] = useState<'approve' | 'reject' | null>(null)
  const [result, setResult] = useState<ActionMessageResult | null>(null)
  const busy = pendingDecision !== null
  const decided = result?.success === true

  async function submit(decision: 'approve' | 'reject') {
    if (busy || decided) return
    setPendingDecision(decision)
    setResult(null)
    try {
      const response = await moderateListing({ id, updatedAt, decision })
      setResult(response)
      toast.add({
        title: response.success ? 'Review completed' : 'Could not complete review',
        description: response.message,
        type: response.success ? 'success' : 'error'
      })
      router.refresh()
    } catch {
      setResult({ success: false, message: 'Could not moderate this listing. Reload it to check its current status before retrying.' })
    } finally {
      setPendingDecision(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">Approve to publish this version, or reject to keep it unavailable to buyers.</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={busy || decided} aria-busy={pendingDecision === 'approve'} onClick={() => void submit('approve')}>
          {pendingDecision === 'approve' ? <LoaderCircle aria-hidden="true" className="motion-safe:animate-spin" /> : <Check aria-hidden="true" />}
          {pendingDecision === 'approve' ? 'Approving...' : 'Approve'}
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={busy || decided}
          aria-busy={pendingDecision === 'reject'}
          onClick={() => void submit('reject')}
        >
          {pendingDecision === 'reject' ? <LoaderCircle aria-hidden="true" className="motion-safe:animate-spin" /> : <X aria-hidden="true" />}
          {pendingDecision === 'reject' ? 'Rejecting...' : 'Reject'}
        </Button>
      </div>
      {result && (
        <p role={result.success ? 'status' : 'alert'} className={result.success ? 'text-sm' : 'text-destructive text-sm'}>
          {result.message}
        </p>
      )}
    </div>
  )
}
