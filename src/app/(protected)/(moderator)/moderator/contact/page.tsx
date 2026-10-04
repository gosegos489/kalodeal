import { Suspense } from 'react'
import { ContactQueue } from '@/features/moderation/contact/contact-queue'
import type { ContactSearchParams } from '@/features/moderation/contact/contact-schema'
import { ModerationLoading } from '@/features/moderation/shared/moderation-loading'

type Props = { searchParams: Promise<ContactSearchParams> }
async function Queue({ searchParams }: Props) {
  return <ContactQueue {...await searchParams} />
}
export default function ContactPage(props: Props) {
  return (
    <Suspense fallback={<ModerationLoading />}>
      <Queue {...props} />
    </Suspense>
  )
}
