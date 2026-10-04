import { Plus } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getAccount } from '@/features/account/data'
import AccountLoading from './loading'

async function AccountOverview() {
  const account = await getAccount()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold wrap-break-word">Welcome, {account.user.name}</h2>
          <p className="text-muted-foreground mt-1 text-sm">Here is an overview of your account.</p>
        </div>
        <Button nativeButton={false} render={<Link href="/sell" />}>
          <Plus /> Create listing
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Used listing slots</CardTitle>
            <CardDescription>Published listings and listings awaiting moderation or changes.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-4">
            <p className="text-3xl font-semibold tabular-nums">
              {account.listingSlotCount}
              <span className="text-muted-foreground text-lg"> / {account.limits.activeListings}</span>
            </p>
            <Button nativeButton={false} variant="outline" render={<Link href="/account/listings" />}>
              My listings
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Current plan</CardTitle>
            <CardDescription>{account.plan === 'PRO' ? 'For active sellers' : 'For occasional sellers'}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-4">
            <Badge>{account.plan === 'PRO' ? 'Pro' : 'Free'}</Badge>
            <ul className="text-muted-foreground space-y-1 text-sm">
              <li>Up to {account.limits.imagesPerListing} photos per listing.</li>
              <li>{account.limits.monthlyBumps > 0 ? `${account.limits.monthlyBumps} listing bumps each month.` : 'Standard listing placement.'}</li>
              <li>{account.limits.advancedStats ? 'Advanced listing analytics included.' : 'Basic account tools included.'}</li>
            </ul>
            <Button nativeButton={false} variant="outline" render={<Link href="/account/subscription" />}>
              View my plan
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AccountPage() {
  return (
    <Suspense fallback={<AccountLoading />}>
      <AccountOverview />
    </Suspense>
  )
}
