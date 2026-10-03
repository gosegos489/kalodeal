import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getApprovedAvatarUrl, pendingAvatarUrl } from '@/features/account/settings/avatar-reference'
import { ProfileForm } from '@/features/account/settings/profile-form'
import { SecurityForm } from '@/features/account/settings/security-form'
import { getSettingsPageActor } from '@/features/account/settings/server'
import prisma from '@/lib/prisma'

async function SettingsForms() {
  const actor = await getSettingsPageActor()
  const [user, credentials] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: actor.id },
      select: {
        name: true,
        pendingName: true,
        nameModerationMessage: true,
        avatarModerationMessage: true,
        email: true,
        image: true,
        pendingAvatarKey: true,
        avatarCleanupKey: true
      }
    }),
    prisma.account.count({ where: { userId: actor.id, providerId: 'credential', password: { not: null } } })
  ])
  return (
    <div className="grid items-stretch gap-6 xl:grid-cols-2">
      <Card id="profile" className="min-w-0 scroll-mt-24 gap-6 py-6">
        <CardHeader className="border-b px-6 pb-6">
          <CardTitle className="text-lg">Profile</CardTitle>
          <CardDescription>Your personal account details.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 px-6">
          <ProfileForm
            userId={actor.id}
            name={user.name.includes('@') ? '' : user.name}
            pendingName={user.pendingName}
            nameModerationMessage={user.nameModerationMessage}
            avatarModerationMessage={user.avatarModerationMessage}
            image={user.pendingAvatarKey ? pendingAvatarUrl(actor.id, user.pendingAvatarKey) : getApprovedAvatarUrl(actor.id, user.image)}
            pending={!!user.pendingAvatarKey}
            cleanupPending={!!user.avatarCleanupKey}
          />
        </CardContent>
      </Card>
      <Card id="security" className="min-w-0 scroll-mt-24 gap-6 py-6">
        <CardHeader className="border-b px-6 pb-6">
          <CardTitle className="text-lg">Security</CardTitle>
          <CardDescription>Sign-in and account protection.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 px-6">
          <SecurityForm email={user.email} hasPassword={credentials > 0} />
        </CardContent>
      </Card>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-semibold">Settings</h2>
      <Suspense
        fallback={
          <div className="grid gap-6 xl:grid-cols-2">
            <Skeleton className="h-96 w-full rounded-xl" />
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        }
      >
        <SettingsForms />
      </Suspense>
    </div>
  )
}
