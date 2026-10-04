import { Suspense } from 'react'
import { ContactReview } from '@/features/moderation/contact-review'
import { ModerationLoading } from '@/features/moderation/moderation-loading'

type Props = { params: Promise<{ id: string }> }
async function Review({ params }: Props) {
  return <ContactReview id={(await params).id} />
}
export default function ContactDetailPage(props: Props) {
  return (
    <Suspense fallback={<ModerationLoading />}>
      <Review {...props} />
    </Suspense>
  )
}
