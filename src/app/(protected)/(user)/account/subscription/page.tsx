import Link from 'next/link'
import { Suspense } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getAccount } from '@/features/account/data'
import AccountLoading from '../loading'

async function AccountSubscription() {
  const account = await getAccount()

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>My plan</h2>
        </CardTitle>
        <CardDescription>Your current publishing allowances.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-6">
        <Badge>{account.plan === 'PRO' ? 'Pro' : 'Free'}</Badge>
        <dl className="grid w-full gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground text-sm">Active listings</dt>
            <dd className="mt-1 text-lg font-semibold">
              {account.activeCount} / {account.limits.activeListings}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm">Photos per listing</dt>
            <dd className="mt-1 text-lg font-semibold">{account.limits.imagesPerListing}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm">Analytics access</dt>
            <dd className="mt-1 text-lg font-semibold">{account.limits.advancedStats ? 'Included' : 'Pro only'}</dd>
          </div>
        </dl>
        <p className="text-muted-foreground text-sm">Plan upgrades and billing management are not available yet.</p>
        {account.limits.advancedStats && (
          <Button nativeButton={false} variant="outline" render={<Link href="/account/analytics" />}>
            Analytics
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<AccountLoading />}>
      <AccountSubscription />
    </Suspense>
  )
}
