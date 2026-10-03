'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { resolveChatReport } from './chat-report-actions'

export function ResolveReportButton({ reportId }: { reportId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  function resolve() {
    setError(null)
    startTransition(async () => {
      try {
        const result = await resolveChatReport({ reportId })
        if (!result.success) {
          setError(result.message)
          return
        }
        toast.add({ type: 'success', title: 'Report resolved', description: result.message })
        router.refresh()
      } catch {
        setError('Could not resolve this report. Reload to check its current status.')
      }
    })
  }
  return (
    <div className="flex flex-col gap-2">
      <Button disabled={pending} aria-busy={pending} onClick={resolve}>
        {pending ? 'Resolving…' : 'Resolve report'}
      </Button>
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
    </div>
  )
}
