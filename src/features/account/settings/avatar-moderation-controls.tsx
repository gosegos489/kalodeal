'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { moderateAvatar, retryAvatarCleanup } from './actions'

export function AvatarModerationControls({ userId, version, cleanup }: { userId: string; version: string | null; cleanup: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  async function submit(decision: 'approve' | 'reject' | 'cleanup') {
    setBusy(true)
    setResult(null)
    try {
      setResult(await (decision === 'cleanup' ? retryAvatarCleanup(userId) : moderateAvatar({ userId, version, decision })))
      router.refresh()
    } catch {
      setResult({ success: false, message: 'Could not moderate this avatar. Please try again.' })
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {version && (
          <>
            <Button type="button" disabled={busy || cleanup} onClick={() => void submit('approve')}>
              Approve
            </Button>
            <Button type="button" variant="outline" disabled={busy || cleanup} onClick={() => void submit('reject')}>
              Reject
            </Button>
          </>
        )}
        {cleanup && (
          <Button type="button" variant="outline" disabled={busy} onClick={() => void submit('cleanup')}>
            Retry cleanup
          </Button>
        )}
      </div>
      {result && (
        <p role={result.success ? 'status' : 'alert'} className={result.success ? 'text-sm' : 'text-destructive text-sm'}>
          {result.message}
        </p>
      )}
    </div>
  )
}
