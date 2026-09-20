import { ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type PublishListingCardProps = {
  isSubmitting: boolean
  disabled: boolean
}

export function PublishListingCard({ isSubmitting, disabled }: PublishListingCardProps) {
  return (
    <section className="bg-card flex flex-col gap-4 rounded-2xl border p-6 shadow-xs">
      <h2 className="font-semibold">Ready to publish?</h2>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Check your details one last time. Your listing will be visible to buyers once published.
      </p>
      <Button className="h-11 w-full cursor-pointer gap-2" size="lg" type="submit" disabled={disabled}>
        {isSubmitting ? <Loader2 className="size-4 motion-safe:animate-spin" /> : <ArrowRight className="size-4" />}
        {isSubmitting ? 'Publishing...' : 'Publish listing'}
      </Button>
      <p className="text-muted-foreground text-center text-xs">
        You can manage your listing in <Link href="/listings">My listings</Link>.
      </p>
    </section>
  )
}
