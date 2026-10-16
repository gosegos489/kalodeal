import 'server-only'
import { Prisma } from '@/generated/prisma/client'
import prisma from '@/lib/prisma'
import { publicListingEligibilitySql } from './public-eligibility-sql'

export { publicListingEligibilitySql } from './public-eligibility-sql'

export async function getPublicListingIds(ids: string[], db: Pick<Prisma.TransactionClient, '$queryRaw'> = prisma, now?: Date) {
  if (!ids.length) return new Set<string>()
  const rows = await db.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT eligible_listing.id FROM listing eligible_listing
    WHERE eligible_listing.id IN (${Prisma.join([...new Set(ids)])}) AND eligible_listing.status = 'ACTIVE'
      AND ${publicListingEligibilitySql(now)}
  `)
  return new Set(rows.map(({ id }) => id))
}
