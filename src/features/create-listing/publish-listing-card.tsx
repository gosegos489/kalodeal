import { ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { ListingStatus } from '@/generated/prisma/enums'

type PublishListingCardProps = {
  isSubmitting: boolean
  disabled: boolean
  editingStatus?: ListingStatus
}

export function PublishListingCard({ isSubmitting, disabled, editingStatus }: PublishListingCardProps) {
  const editing = editingStatus !== undefined
  return (
    <section className="bg-card flex flex-col gap-4 rounded-2xl border p-6 shadow-xs">
      <h2 className="font-semibold">{editing ? 'Save your changes' : 'Ready to publish?'}</h2>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {editingStatus === 'ACTIVE'
          ? 'Changing an active listing sends it back to pending moderation. It will be visible to buyers again after approval.'
          : editing
            ? 'Check your updated details before saving. Your current listing status will be kept.'
            : 'Check your details one last time. Your listing will be visible to buyers after moderator approval.'}
      </p>
      <Button className="h-11 w-full cursor-pointer gap-2" size="lg" type="submit" disabled={disabled}>
        {isSubmitting ? <Loader2 className="size-4 motion-safe:animate-spin" /> : <ArrowRight className="size-4" />}
        {isSubmitting ? (editing ? 'Saving...' : 'Publishing...') : editing ? 'Save changes' : 'Publish listing'}
      </Button>
      <p className="text-muted-foreground text-center text-xs">
        You can manage your listing in <Link href="/account/listings">My listings</Link>.
      </p>
    </section>
  )
}
