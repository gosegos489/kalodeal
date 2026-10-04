import { Suspense } from 'react'
import { ListingModerationQueue } from '@/features/moderation/listings/listing-moderation-queue'
import { ModerationLoading } from '@/features/moderation/shared/moderation-loading'
import type { ModerationSearchParams } from '@/features/moderation/shared/search'

type Props = { searchParams: Promise<ModerationSearchParams> }

async function Queue({ searchParams }: Props) {
  const params = await searchParams
  return <ListingModerationQueue {...params} />
}

export default function ModeratorListingsPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<ModerationLoading />}>
      <Queue searchParams={searchParams} />
    </Suspense>
  )
}
