import { Suspense } from 'react'
import { ListingReview } from '@/features/moderation/listings/listing-review'
import { ModerationLoading } from '@/features/moderation/shared/moderation-loading'

type Props = { params: Promise<{ id: string }> }

async function Review({ params }: Props) {
  const { id } = await params
  return <ListingReview id={id} />
}

export default function ModeratorListingPage({ params }: Props) {
  return (
    <Suspense fallback={<ModerationLoading />}>
      <Review params={params} />
    </Suspense>
  )
}
