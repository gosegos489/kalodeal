import { BarChart3, LockKeyhole } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AccountPlaceholder } from '@/features/account/account-placeholder'
import { getAccount } from '@/features/account/data'
import AccountLoading from '../loading'

async function AccountAnalytics() {
  const account = await getAccount()

  // Check current server entitlements even when this URL is opened directly.
  if (!account.limits.advancedStats) {
    return (
      <Card>
        <CardHeader>
          <LockKeyhole aria-hidden="true" className="text-primary mb-3 size-6" />
          <CardTitle>
            <h2>Analytics is a Pro feature</h2>
          </CardTitle>
          <CardDescription>You need an eligible Pro plan to access listing analytics.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button nativeButton={false} render={<Link href="/account/subscription" />}>
            View my plan
          </Button>
        </CardContent>
      </Card>
    )
  }

  return <AccountPlaceholder title="Analytics" description="Your plan includes analytics. Listing insights are not available yet." icon={BarChart3} />
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AccountLoading />}>
      <AccountAnalytics />
    </Suspense>
  )
}
