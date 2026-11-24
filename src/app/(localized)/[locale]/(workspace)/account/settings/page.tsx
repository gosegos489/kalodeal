import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AccountSettingsSkeleton } from '@/features/account/account-skeleton'
import { AccountTypeForm } from '@/features/account/settings/account-type-form'
import { getApprovedAvatarUrl, pendingAvatarUrl } from '@/features/account/settings/avatar-reference'
import { BusinessDetailsForm } from '@/features/account/settings/business-details-form'
import { BusinessNameForm } from '@/features/account/settings/business-name-form'
import { businessDetailsSchema, emptyBusinessDetails } from '@/features/account/settings/business-schema'
import { ProfileForm } from '@/features/account/settings/profile-form'
import { ProfilePhotoForm } from '@/features/account/settings/profile-photo-form'
import { SecurityForm } from '@/features/account/settings/security-form'
import { getSettingsPageActor } from '@/features/account/settings/server'
import { Link } from '@/i18n/navigation'
import prisma from '@/lib/prisma'

async function SettingsForms() {
  const t = await getTranslations('Workspace')

  const actor = await getSettingsPageActor()
  const [user, credentials] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: actor.id },
      select: {
        name: true,
        accountType: true,
        businessProfile: {
          select: { description: true, address: true, website: true, openingHours: true, pendingDetails: true, moderationMessage: true }
        },
        businessName: true,
        pendingBusinessName: true,
        businessNameModerationMessage: true,
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
  const business = user.accountType === 'BUSINESS'
  const pendingDetails = businessDetailsSchema.safeParse(user.businessProfile?.pendingDetails)
  const details = pendingDetails.success
    ? pendingDetails.data
    : {
        ...emptyBusinessDetails,
        description: user.businessProfile?.description ?? '',
        address: user.businessProfile?.address ?? '',
        website: user.businessProfile?.website ?? '',
        openingHours: user.businessProfile?.openingHours ?? ''
      }
  const photo = {
    userId: actor.id,
    avatarModerationMessage: user.avatarModerationMessage,
    image: user.pendingAvatarKey ? pendingAvatarUrl(actor.id, user.pendingAvatarKey) : getApprovedAvatarUrl(actor.id, user.image),
    pending: !!user.pendingAvatarKey,
    cleanupPending: !!user.avatarCleanupKey
  }
  return (
    <div className="grid items-stretch gap-6 xl:grid-cols-2">
      <Card id="profile" className="min-w-0 scroll-mt-24 gap-6 py-6">
        <CardHeader className="border-b px-6 pb-6">
          <CardTitle className="text-lg">{t('profile')}</CardTitle>
          <CardDescription>{t('yourPersonalAccountDetails')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 px-6">
          <ProfileForm
            {...photo}
            business={business}
            name={user.name.includes('@') ? '' : user.name}
            pendingName={user.pendingName}
            nameModerationMessage={user.nameModerationMessage}
          />
        </CardContent>
      </Card>
      <Card id="account-type" className="min-w-0 scroll-mt-24 gap-6 py-6">
        <CardHeader>
          <CardTitle>{t('accountType')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AccountTypeForm business={business} />
          <Link href={`/sellers/${encodeURIComponent(actor.id)}`} className="text-primary text-sm underline underline-offset-4">
            {t('viewPublicSellerProfile')}
          </Link>
        </CardContent>
      </Card>
      {business && (
        <Card id="business" className="min-w-0 scroll-mt-24 gap-6 py-6">
          <CardHeader>
            <CardTitle>{t('businessProfile')}</CardTitle>
            <CardDescription>{t('manageYourPublicBusinessInformationNewContentIsReviewedBeforePublication')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ProfilePhotoForm {...photo} business />
            <div className="border-t pt-6">
              <BusinessNameForm name={user.businessName} pendingName={user.pendingBusinessName} feedback={user.businessNameModerationMessage} />
            </div>
            <div className="border-t pt-6">
              <BusinessDetailsForm values={details} pending={pendingDetails.success} feedback={user.businessProfile?.moderationMessage ?? null} />
            </div>
          </CardContent>
        </Card>
      )}
      <Card id="security" className="min-w-0 scroll-mt-24 gap-6 py-6">
        <CardHeader className="border-b px-6 pb-6">
          <CardTitle className="text-lg">{t('security')}</CardTitle>
          <CardDescription>{t('signInAndAccountProtection')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 px-6">
          <SecurityForm email={user.email} hasPassword={credentials > 0} />
        </CardContent>
      </Card>
    </div>
  )
}

export default function SettingsPage() {
  const t = useTranslations('Workspace')

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-semibold">{t('settings')}</h2>
      <Suspense fallback={<AccountSettingsSkeleton />}>
        <SettingsForms />
      </Suspense>
    </div>
  )
}
