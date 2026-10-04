import { UserRound } from 'lucide-react'
import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getSellerName } from '@/entities/user/public-profile'
import { ModerationSearch } from '@/features/moderation/moderation-search'
import { profileModerationWhere } from '@/features/moderation/search'
import { getPagination } from '@/lib/pagination'
import prisma from '@/lib/prisma'
import { cn } from '@/lib/utils'
import NuqsPagination from '@/shared/ui/NuqsPagination'
import { RouteAutoRefresh } from '@/shared/ui/route-auto-refresh'
import { ProfileModerationControls } from './avatar-moderation-controls'
import { avatarVersion, getApprovedAvatarUrl, pendingAvatarUrl } from './avatar-reference'
import { nameModerationVersion } from './name-moderation'
import { AwaitingModeration } from './profile-moderation-notice'
import { getSettingsPageActor } from './server'

export async function AvatarModerationQueue({ page, q, embedded = false }: { page?: string | string[]; q?: string | string[]; embedded?: boolean }) {
  await getSettingsPageActor(true)
  const where = profileModerationWhere(q)
  const totalItems = await prisma.user.count({ where })
  const pagination = getPagination({ pageParam: page, totalItems })
  const users = await prisma.user.findMany({
    where,
    select: { id: true, name: true, pendingName: true, updatedAt: true, email: true, image: true, pendingAvatarKey: true, avatarCleanupKey: true },
    orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
    skip: pagination.skip,
    take: pagination.take
  })
  const Heading = embedded ? 'h2' : 'h1'
  return (
    <section aria-labelledby="avatar-moderation-heading" className={cn('flex min-w-0 flex-col gap-6', !embedded && 'container max-w-5xl py-8')}>
      <RouteAutoRefresh />
      <div>
        <Heading id="avatar-moderation-heading" className="text-2xl font-semibold">
          Profile moderation
        </Heading>
        <p className="text-muted-foreground mt-1 text-sm">
          Review pending names and avatars before they appear publicly, or retry unfinished storage cleanup.
        </p>
      </div>
      <ModerationSearch kind="avatars" />
      {!users.length && <p className="text-muted-foreground">No profiles found awaiting moderation or cleanup.</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {users.map((user) => {
          const approved = getApprovedAvatarUrl(user.id, user.image)
          const pending = user.pendingAvatarKey ? pendingAvatarUrl(user.id, user.pendingAvatarKey) : null
          const version = user.pendingAvatarKey ? avatarVersion(user.id, user.pendingAvatarKey) : null
          return (
            <Card key={user.id} className="min-w-0">
              <CardHeader>
                <CardTitle className="wrap-anywhere">{getSellerName(user.name)}</CardTitle>
                <CardDescription className="wrap-break-word">{user.email}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 border-b pb-4">
                  <p className="text-muted-foreground text-xs">Approved name</p>
                  <p className="text-sm wrap-anywhere">{getSellerName(user.name)}</p>
                  {user.pendingName && (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-muted-foreground text-xs">Pending name</p>
                        <AwaitingModeration />
                      </div>
                      <p className="text-sm wrap-anywhere">{user.pendingName}</p>
                      <ProfileModerationControls userId={user.id} version={nameModerationVersion(user.pendingName, user.updatedAt)} kind="name" />
                    </>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">Profile photo</p>
                  {pending && <AwaitingModeration />}
                </div>
                <div className="flex flex-wrap gap-6">
                  {[
                    { label: 'Approved avatar', url: approved },
                    { label: 'Pending avatar', url: pending }
                  ].map(({ label, url }) => (
                    <div key={label} className="flex flex-col gap-2">
                      <p className="text-muted-foreground text-xs">{label}</p>
                      <Avatar className="size-24">
                        {url && <AvatarImage src={url} alt={label} render={<Image src={url} alt={label} width={96} height={96} unoptimized />} />}
                        <AvatarFallback>
                          <UserRound aria-hidden="true" className="size-8" />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  ))}
                </div>
                {user.avatarCleanupKey && <p className="text-muted-foreground text-sm">Storage cleanup is pending.</p>}
                <ProfileModerationControls userId={user.id} version={version} kind="avatar" cleanup={!!user.avatarCleanupKey} />
              </CardContent>
            </Card>
          )
        })}
      </div>
      <NuqsPagination totalPages={pagination.totalPages} ariaLabel="Profile moderation pages" />
    </section>
  )
}
