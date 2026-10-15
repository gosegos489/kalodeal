import 'server-only'
import { Prisma } from '@/generated/prisma/client'
import { LISTING_SLOT_STATUSES, PLAN_LIMITS } from '@/lib/plan-limits'
import prisma from '@/lib/prisma'

// The SQL caller uses the fixed alias eligible_listing. No client SQL fragments.
// Oldest reserved slots stay eligible after a downgrade; data/statuses are retained.
// Indexed owner/status lookup stops after the largest plan's slot count + 1.
// Explicit CASE result types prevent untyped parameters from resolving to text.
export function publicListingEligibilitySql(at?: Date) {
  const now = at ? Prisma.sql`(${at}::timestamptz AT TIME ZONE 'UTC')` : Prisma.sql`(statement_timestamp() AT TIME ZONE 'UTC')`
  return Prisma.sql`(
    SELECT COUNT(*) FROM (
      SELECT 1 FROM listing reserved
      WHERE reserved."userId" = eligible_listing."userId"
        AND reserved.status IN (${Prisma.join(LISTING_SLOT_STATUSES.map((status) => Prisma.sql`${status}::"ListingStatus"`))})
        AND (reserved."createdAt", reserved.id) <= (eligible_listing."createdAt", eligible_listing.id)
      LIMIT ${PLAN_LIMITS.BUSINESS.activeListings + 1}::integer
    ) occupied
  ) <= (
    SELECT CASE
      WHEN s.plan = 'BUSINESS' AND s.status IN ('ACTIVE', 'CANCELED') AND s."currentPeriodStart" <= ${now} AND s."currentPeriodEnd" > ${now} THEN ${PLAN_LIMITS.BUSINESS.activeListings}::bigint
      WHEN (s.plan = 'PRO' AND s.status IN ('ACTIVE', 'CANCELED') AND s."currentPeriodStart" <= ${now} AND s."currentPeriodEnd" > ${now})
        OR EXISTS (SELECT 1 FROM plan_grant g WHERE g."userId" = eligible_listing."userId" AND g.plan = 'PRO' AND g."revokedAt" IS NULL AND g."startsAt" <= ${now} AND g."endsAt" > ${now}) THEN ${PLAN_LIMITS.PRO.activeListings}::bigint
      WHEN s.plan = 'PLUS' AND s.status IN ('ACTIVE', 'CANCELED') AND s."currentPeriodStart" <= ${now} AND s."currentPeriodEnd" > ${now} THEN ${PLAN_LIMITS.PLUS.activeListings}::bigint
      ELSE ${PLAN_LIMITS.FREE.activeListings}::bigint
    END FROM (SELECT 1) singleton LEFT JOIN subscription s ON s."userId" = eligible_listing."userId"
  )`
}

export async function getPublicListingIds(ids: string[], db: Pick<Prisma.TransactionClient, '$queryRaw'> = prisma) {
  if (!ids.length) return new Set<string>()
  const rows = await db.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT eligible_listing.id FROM listing eligible_listing
    WHERE eligible_listing.id IN (${Prisma.join([...new Set(ids)])}) AND eligible_listing.status = 'ACTIVE'
      AND ${publicListingEligibilitySql()}
  `)
  return new Set(rows.map(({ id }) => id))
}
