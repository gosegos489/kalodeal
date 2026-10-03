import { ArrowRight, Flag, Images, List, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getModerationOverview } from './data'
import { ModerationListingRow } from './moderation-listing-row'

export async function ModerationDashboard() {
  const overview = await getModerationOverview()
  const metrics = [
    {
      label: 'Open chat reports',
      count: overview.openChatReports,
      description: 'Reported conversations awaiting review.',
      href: '/moderator/chat-reports',
      icon: Flag
    },
    {
      label: 'Pending listings',
      count: overview.pendingListings,
      description: 'Listings awaiting approval.',
      href: '/moderator/listings',
      icon: List
    },
    {
      label: 'Pending avatars',
      count: overview.pendingAvatars,
      description: 'Profile photos awaiting approval.',
      href: '/moderator/avatars',
      icon: Images
    },
    {
      label: 'Avatar cleanup',
      count: overview.avatarCleanup,
      description: 'Accounts with storage cleanup to retry.',
      href: '/moderator/avatars',
      icon: RefreshCw
    }
  ]

  return (
    <section aria-labelledby="moderation-dashboard-heading" className="flex min-w-0 flex-col gap-6">
      <div>
        <h2 id="moderation-dashboard-heading" className="text-2xl font-semibold">
          Dashboard
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">Current moderation queues. Avatar reviews and cleanup can overlap.</p>
      </div>
      <div className="grid min-w-0 auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, count, description, href, icon: Icon }) => (
          <Card key={label} className="min-w-0">
            <CardHeader className="flex flex-1 flex-col">
              <Icon aria-hidden="true" className="text-primary mb-2 size-5" />
              <CardTitle className="min-h-11">{label}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto flex flex-col items-start gap-3">
              <p className="text-3xl font-semibold tabular-nums">{count}</p>
              <Button nativeButton={false} variant="outline" size="sm" render={<Link href={href} />}>
                Open queue <ArrowRight aria-hidden="true" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold">Recent pending listings</h3>
          <p className="text-muted-foreground text-sm">
            Up to five listings, ordered by their latest content update. Review oldest items in Listings.
          </p>
        </div>
        {overview.recentListings.length ? (
          overview.recentListings.map((listing) => <ModerationListingRow key={listing.id} listing={listing} />)
        ) : (
          <p className="bg-card text-muted-foreground rounded-xl border border-dashed p-6 text-sm">No listings awaiting moderation.</p>
        )}
      </div>
    </section>
  )
}
