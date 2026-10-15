import type { Prisma } from '@/generated/prisma/client'
import type { ListingFilters } from './schema'

export function getListingWhere({ query, category, district, area }: ListingFilters): Prisma.ListingWhereInput {
  return {
    status: 'ACTIVE',
    ...(district && { district }),
    ...(area && { area }),
    ...(query && {
      OR: [{ title: { contains: query, mode: 'insensitive' } }, { description: { contains: query, mode: 'insensitive' } }]
    }),
    ...(category && {
      category: {
        OR: [{ slug: category }, { parent: { is: { slug: category } } }, { parent: { is: { parent: { is: { slug: category } } } } }]
      }
    })
  }
}
