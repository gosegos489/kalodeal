import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ModerationSearch } from '@/features/moderation/shared/moderation-search'
import type { ModerationSearchParams } from '@/features/moderation/shared/search'
import NuqsPagination from '@/shared/ui/NuqsPagination'
import { getAccessGrantUsers } from './data'
import { GrantUserIdentity } from './user-identity'

export async function AccessGrantUsers(params: ModerationSearchParams) {
  const result = await getAccessGrantUsers(params)
  return (
    <section aria-labelledby="access-grants-heading" className="flex min-w-0 flex-col gap-6">
      <div>
        <h2 id="access-grants-heading" className="text-2xl font-semibold">
          Access grants
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">Find an account to grant complimentary Pro access or bonus bumps.</p>
      </div>
      <ModerationSearch kind="users" />
      <p role="status" className="text-muted-foreground text-sm">
        {result.totalItems} users found · Page {result.page}
      </p>
      {result.users.map((user) => (
        <Card key={user.id}>
          <CardContent className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <GrantUserIdentity user={user} />
            <Button nativeButton={false} variant="outline" render={<Link href={`/moderator/access-grants/${encodeURIComponent(user.id)}`} />}>
              Manage access
            </Button>
          </CardContent>
        </Card>
      ))}
      {!result.users.length && <p className="text-muted-foreground text-sm">No users found.</p>}
      <NuqsPagination totalPages={result.totalPages} ariaLabel="Access grants user pages" />
    </section>
  )
}
