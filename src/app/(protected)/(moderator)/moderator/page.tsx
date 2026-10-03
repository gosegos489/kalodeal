import { Suspense } from 'react'
import { ModerationDashboard } from '@/features/moderation/moderation-dashboard'
import { ModerationLoading } from '@/features/moderation/moderation-loading'

export default function ModeratorPage() {
  return (
    <Suspense fallback={<ModerationLoading />}>
      <ModerationDashboard />
    </Suspense>
  )
}
