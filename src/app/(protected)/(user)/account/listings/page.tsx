import { List } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AccountPlaceholder } from '@/features/account/account-placeholder'

export default function ListingsPage() {
  return (
    <AccountPlaceholder
      title="My listings"
      description="Listing management will be available here. You can already publish a new listing."
      icon={List}
    >
      <Button nativeButton={false} render={<Link href="/sell" />}>
        Create listing
      </Button>
    </AccountPlaceholder>
  )
}
