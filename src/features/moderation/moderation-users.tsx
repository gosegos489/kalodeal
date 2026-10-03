import { UserRound } from 'lucide-react'
import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import NuqsPagination from '@/shared/ui/NuqsPagination'
import { getModerationUsers } from './data'
import { ModerationSearch } from './moderation-search'
import type { ModerationSearchParams } from './search'
import { UserBanControls } from './user-ban-controls'

export async function ModerationUsers(params: ModerationSearchParams) {
  const { users, totalItems, totalPages, page, pageSize } = await getModerationUsers(params)
  return (
    <section aria-labelledby="moderation-users-heading" className="flex min-w-0 flex-col gap-6">
      <div>
        <h2 id="moderation-users-heading" className="text-2xl font-semibold">
          Users
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">Review accounts and manage bans according to your permissions.</p>
      </div>
      <ModerationSearch kind="users" />
      {users.length ? (
        <>
          <p role="status" className="text-muted-foreground text-sm">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} of {totalItems} users
          </p>
          <div className="flex min-w-0 flex-col gap-4">
            {users.map((user) => (
              <Card key={user.id} className="min-w-0">
                <CardContent className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
                  <Avatar className="size-12 shrink-0">
                    {user.avatarUrl && (
                      <AvatarImage src={user.avatarUrl} alt="" render={<Image src={user.avatarUrl} alt="" width={48} height={48} unoptimized />} />
                    )}
                    <AvatarFallback>
                      <UserRound aria-hidden="true" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="font-medium wrap-anywhere">{user.name}</p>
                    <p className="text-muted-foreground text-sm wrap-anywhere">{user.email}</p>
                    <p className="text-muted-foreground text-xs wrap-anywhere">ID: {user.id}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{user.role ?? 'Unassigned role'}</Badge>
                      <Badge variant={user.banned ? 'destructive' : 'secondary'}>{user.banned ? 'Banned' : 'Active'}</Badge>
                    </div>
                    {user.banned && (
                      <>
                        <p className="text-sm">
                          {user.banExpires ? (
                            <>
                              Expires: <time dateTime={user.banExpires}>{user.banExpires.replace('T', ' ').replace('.000Z', ' UTC')}</time>
                            </>
                          ) : (
                            'Permanent ban'
                          )}
                        </p>
                        {user.banReason && <p className="text-muted-foreground text-sm wrap-anywhere">Reason: {user.banReason}</p>}
                      </>
                    )}
                    {user.expired && <p className="text-muted-foreground text-sm">The temporary ban has expired. The user can sign in again.</p>}
                  </div>
                  <div className="min-w-0 sm:max-w-52">
                    {user.canManageBan ? (
                      <UserBanControls userId={user.id} name={user.name} banned={user.banned} />
                    ) : (
                      <p className="text-muted-foreground text-sm">Ban management unavailable for this account.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <p className="bg-card text-muted-foreground rounded-xl border border-dashed p-6 text-sm">No users found.</p>
      )}
      <NuqsPagination totalPages={totalPages} ariaLabel="User moderation pages" />
    </section>
  )
}
