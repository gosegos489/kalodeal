import { UserRound } from 'lucide-react'
import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getSellerName } from '@/entities/user/public-profile'
import { getPagination } from '@/lib/pagination'
import prisma from '@/lib/prisma'
import NuqsPagination from '@/shared/ui/NuqsPagination'
import { AvatarModerationControls } from './avatar-moderation-controls'
import { avatarVersion, getApprovedAvatarUrl, pendingAvatarUrl } from './avatar-reference'
import { getSettingsPageActor } from './server'

export async function AvatarModerationQueue({ page }: { page?: string | string[] }) {
  await getSettingsPageActor(true)
  const where = { OR: [{ pendingAvatarKey: { not: null } }, { avatarCleanupKey: { not: null } }] }
  const totalItems = await prisma.user.count({ where })
  const pagination = getPagination({ pageParam: page, totalItems })
  const users = await prisma.user.findMany({
    where,
    select: { id: true, name: true, email: true, image: true, pendingAvatarKey: true, avatarCleanupKey: true },
    orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
    skip: pagination.skip,
    take: pagination.take
  })
  return (
    <section className="container flex max-w-5xl flex-col gap-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Avatar moderation</h1>
        <p className="text-muted-foreground text-sm">Review pending avatars before they appear publicly.</p>
      </div>
      {!users.length && <p className="text-muted-foreground">No avatars awaiting moderation.</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {users.map((user) => {
          const approved = getApprovedAvatarUrl(user.id, user.image)
          const pending = user.pendingAvatarKey ? pendingAvatarUrl(user.id, user.pendingAvatarKey) : null
          const version = user.pendingAvatarKey ? avatarVersion(user.id, user.pendingAvatarKey) : null
          return (
            <Card key={user.id}>
              <CardHeader>
                <CardTitle>{getSellerName(user.name)}</CardTitle>
                <CardDescription className="wrap-break-word">{user.email}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex gap-6">
                  {[
                    { label: 'Approved', url: approved },
                    { label: 'Pending', url: pending }
                  ].map(({ label, url }) => (
                    <div key={label} className="flex flex-col gap-2">
                      <p className="text-muted-foreground text-xs">{label}</p>
                      <Avatar className="size-24">
                        {url && (
                          <AvatarImage
                            src={url}
                            alt={`${label} avatar`}
                            render={<Image src={url} alt={`${label} avatar`} width={96} height={96} unoptimized />}
                          />
                        )}
                        <AvatarFallback>
                          <UserRound aria-hidden="true" className="size-8" />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  ))}
                </div>
                {user.avatarCleanupKey && <p className="text-muted-foreground text-sm">Storage cleanup is pending.</p>}
                <AvatarModerationControls userId={user.id} version={version} cleanup={!!user.avatarCleanupKey} />
              </CardContent>
            </Card>
          )
        })}
      </div>
      <NuqsPagination totalPages={pagination.totalPages} ariaLabel="Avatar moderation pages" />
    </section>
  )
}
