import { cacheLife, cacheTag } from 'next/cache'
import 'server-only'
import z from 'zod'
import { cache } from 'react'
import { publicListingEligibilitySql } from '@/entities/listing/public-eligibility'
import { getApprovedAvatarUrl } from '@/features/account/settings/avatar-reference'
import { Prisma } from '@/generated/prisma/client'
import { canUseMarketplace } from '@/lib/account-role'
import { hasActiveBan } from '@/lib/ban-status'
import { cacheTags } from '@/lib/cache-tags'
import { PLAN_LIMITS, getPaidListingPlan } from '@/lib/plan-limits'
import prisma from '@/lib/prisma'
import { getSellerName } from './public-profile'

export const sellerIdSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[a-zA-Z0-9_-]+$/)

// Approved content only. Bans, account type, counts and paid access are read at
// request time, so expiry and downgrades cannot be masked by this cache.
async function getSellerContent(id: string) {
  'use cache'
  cacheLife('hours')
  // Reuse all listing mutation invalidations for routes consuming this seller;
  // actual counts/results remain uncached to handle entitlement expiry.
  cacheTag(cacheTags.sellers, cacheTags.listings)
  return prisma.user.findUnique({
    where: { id },
    select: {
      name: true,
      image: true,
      businessName: true,
      businessProfile: { select: { description: true, address: true, website: true, openingHours: true } }
    }
  })
}

export async function getSellerCategoryCounts(userId: string, db: Pick<Prisma.TransactionClient, '$queryRaw'> = prisma, now?: Date) {
  return db.$queryRaw<{ categoryId: string; count: number }[]>(Prisma.sql`
    SELECT eligible_listing."categoryId", COUNT(*)::int AS count
    FROM listing eligible_listing
    WHERE eligible_listing."userId" = ${userId} AND eligible_listing.status = 'ACTIVE'
      AND ${publicListingEligibilitySql(now)}
    GROUP BY eligible_listing."categoryId"
  `)
}

export const getPublicSeller = cache(async (input: string) => {
  const parsed = sellerIdSchema.safeParse(input)
  if (!parsed.success) return null
  const id = parsed.data
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      accountType: true,
      createdAt: true,
      role: true,
      banned: true,
      banExpires: true,
      subscription: { select: { plan: true, status: true, currentPeriodStart: true, currentPeriodEnd: true } }
    }
  })
  if (!user || hasActiveBan(user) || !canUseMarketplace(user.role)) return null
  const [content, counts] = await Promise.all([getSellerContent(id), getSellerCategoryCounts(id)])
  if (!content) return null
  const business = user.accountType === 'BUSINESS'
  const premiumBranding = PLAN_LIMITS[getPaidListingPlan(user.subscription)].businessNameEnabled
  return {
    id,
    accountType: user.accountType,
    createdAt: user.createdAt,
    name: business && content.businessName ? getSellerName(content.businessName) : getSellerName(content.name),
    listingName: premiumBranding && content.businessName ? getSellerName(content.businessName) : getSellerName(content.name),
    image: getApprovedAvatarUrl(id, content.image),
    listingImage: business && !premiumBranding ? null : getApprovedAvatarUrl(id, content.image),
    details: business ? content.businessProfile : null,
    activeAds: counts.reduce((total, row) => total + row.count, 0)
  }
})

export type PublicSeller = NonNullable<Awaited<ReturnType<typeof getPublicSeller>>>
