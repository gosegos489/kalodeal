import { Prisma } from '@/generated/prisma/client'

// A narrow adapter for the predicates emitted by buildListingAttributeQuery.
// The typed Prisma where is the single source for filtering, count and page IDs.
// SQL is necessary only to compose that predicate with the existing correlated
// entitlement check before LIMIT/OFFSET. Unsupported fields/operators fail closed.
// All identifiers below are fixed code; all input values are bound parameters.
const columns = {
  listing: {
    id: 'text',
    status: 'ListingStatus',
    district: 'text',
    area: 'text',
    title: 'text',
    description: 'text',
    currency: 'ListingCurrency',
    pricePeriod: 'ListingPricePeriod',
    price: 'number'
  },
  category: { slug: 'text' },
  user: { accountType: 'AccountType', role: 'text', banned: 'boolean', banExpires: 'date' },
  property: {
    propertyType: 'PropertyType',
    bedrooms: 'number',
    bathrooms: 'number',
    propertyArea: 'number',
    plotArea: 'number',
    constructionYear: 'number',
    parking: 'PropertyParking',
    furnishing: 'PropertyFurnishing',
    airConditioning: 'boolean',
    petsAllowed: 'boolean',
    amenities: 'PropertyAmenity[]',
    energyRating: 'PropertyEnergyRating'
  },
  vehicle: {
    vehicleType: 'VehicleType',
    make: 'text',
    model: 'text',
    year: 'number',
    mileage: 'number',
    fuel: 'VehicleFuel',
    transmission: 'VehicleTransmission',
    bodyType: 'VehicleBodyType',
    engineCapacity: 'number',
    seats: 'number',
    condition: 'VehicleCondition'
  }
} as const

type Scope = keyof typeof columns
const relations: Record<string, { scope: Scope; table: string; on: (parent: string, child: string) => Prisma.Sql }> = {
  'listing.category': { scope: 'category', table: 'category', on: (p, c) => Prisma.sql`${identifier(p, 'categoryId')} = ${identifier(c, 'id')}` },
  'listing.user': { scope: 'user', table: 'user', on: (p, c) => Prisma.sql`${identifier(p, 'userId')} = ${identifier(c, 'id')}` },
  'listing.propertyDetails': {
    scope: 'property',
    table: 'property_details',
    on: (p, c) => Prisma.sql`${identifier(p, 'id')} = ${identifier(c, 'listingId')}`
  },
  'listing.vehicleDetails': {
    scope: 'vehicle',
    table: 'vehicle_details',
    on: (p, c) => Prisma.sql`${identifier(p, 'id')} = ${identifier(c, 'listingId')}`
  },
  'category.parent': { scope: 'category', table: 'category', on: (p, c) => Prisma.sql`${identifier(p, 'parentId')} = ${identifier(c, 'id')}` }
}

function identifier(alias: string, column: string) {
  return Prisma.raw(`"${alias}"."${column}"`)
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)
}
function join(clauses: Prisma.Sql[], operator: 'AND' | 'OR') {
  return clauses.length ? Prisma.sql`(${Prisma.join(clauses, ` ${operator} `)})` : Prisma.raw(operator === 'AND' ? 'TRUE' : 'FALSE')
}
function scalar(value: unknown): string | number | boolean | Date {
  if (typeof value === 'string' || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value)) || value instanceof Date)
    return value
  throw new Error('Unsupported search value')
}

export function listingSearchWhereSql(where: Prisma.ListingWhereInput): Prisma.Sql {
  let relationIndex = 0
  function visit(input: unknown, scope: Scope, alias: string): Prisma.Sql {
    if (!record(input)) throw new Error('Unsupported search predicate')
    const clauses: Prisma.Sql[] = []
    for (const [key, value] of Object.entries(input)) {
      if (value === undefined) continue
      if (key === 'AND' || key === 'OR' || key === 'NOT') {
        const group = (Array.isArray(value) ? value : [value]).map((item) => visit(item, scope, alias))
        clauses.push(
          key === 'NOT'
            ? join(
                group.map((item) => Prisma.sql`NOT ${item}`),
                'AND'
              )
            : join(group, key)
        )
        continue
      }
      const relation = relations[`${scope}.${key}`]
      if (relation) {
        const child = `search_relation_${relationIndex++}`
        const nested = record(value) && 'is' in value ? value.is : value
        clauses.push(
          Prisma.sql`EXISTS (SELECT 1 FROM ${Prisma.raw(`"${relation.table}"`)} ${Prisma.raw(`"${child}"`)} WHERE ${relation.on(alias, child)} AND ${visit(nested, relation.scope, child)})`
        )
        continue
      }
      const fields: Readonly<Record<string, string>> = columns[scope]
      if (!Object.hasOwn(fields, key)) throw new Error('Unsupported search field')
      const column = identifier(alias, key)
      const bind = (input: unknown) => {
        const value = scalar(input)
        return ['text', 'number', 'boolean', 'date'].includes(fields[key])
          ? Prisma.sql`${value}`
          : Prisma.sql`${value}::${Prisma.raw(`"${fields[key]}"`)}`
      }
      if (value === null) clauses.push(Prisma.sql`${column} IS NULL`)
      else if (!record(value)) clauses.push(Prisma.sql`${column} = ${bind(value)}`)
      else {
        for (const [operator, operand] of Object.entries(value)) {
          if (operand === undefined || operator === 'mode') continue
          if (operator === 'gte') clauses.push(Prisma.sql`${column} >= ${bind(operand)}`)
          else if (operator === 'lte') clauses.push(Prisma.sql`${column} <= ${bind(operand)}`)
          else if (operator === 'not') clauses.push(operand === null ? Prisma.sql`${column} IS NOT NULL` : Prisma.sql`${column} <> ${bind(operand)}`)
          else if (operator === 'contains' && typeof operand === 'string')
            clauses.push(value.mode === 'insensitive' ? Prisma.sql`${column} ILIKE ${`%${operand}%`}` : Prisma.sql`${column} LIKE ${`%${operand}%`}`)
          else if ((operator === 'in' || operator === 'hasEvery') && Array.isArray(operand)) {
            if (!operand.length) clauses.push(Prisma.raw(operator === 'in' ? 'FALSE' : 'TRUE'))
            else if (operator === 'in') clauses.push(Prisma.sql`${column} IN (${Prisma.join(operand.map(bind))})`)
            else clauses.push(Prisma.sql`${column} @> ARRAY[${Prisma.join(operand.map(scalar))}]::"PropertyAmenity"[]`)
          } else throw new Error('Unsupported search operator')
        }
      }
    }
    return join(clauses, 'AND')
  }
  return visit(where, 'listing', 'eligible_listing')
}

export function listingSearchOrderSql(orderBy: Prisma.ListingOrderByWithRelationInput[]) {
  // Deliberately limited to the existing stable listing order plus price sorting.
  return Prisma.join(
    orderBy.flatMap((order) =>
      Object.entries(order).map(([key, value]) => {
        if (!['price', 'sortDate', 'id'].includes(key)) throw new Error('Unsupported search ordering')
        const direction = typeof value === 'string' ? value : record(value) && 'sort' in value ? value.sort : undefined
        if (direction !== 'asc' && direction !== 'desc') throw new Error('Unsupported search direction')
        return Prisma.sql`${identifier('eligible_listing', key)} ${Prisma.raw(direction.toUpperCase())} ${key === 'price' ? Prisma.raw('NULLS LAST') : Prisma.empty}`
      })
    )
  )
}

export function listingSearchPageSql(
  predicate: Prisma.Sql,
  orderBy: Prisma.ListingOrderByWithRelationInput[],
  featuredIds: string[],
  pagination: { take: number; skip: number }
) {
  const ordering = listingSearchOrderSql(orderBy)
  // Keep the ordinary no-Featured path able to use ORDER BY/LIMIT indexes.
  if (!featuredIds.length)
    return Prisma.sql`
    SELECT eligible_listing.id FROM listing eligible_listing WHERE ${predicate}
    ORDER BY ${ordering} LIMIT ${pagination.take}::integer OFFSET ${pagination.skip}::integer
  `
  return Prisma.sql`
    WITH organic AS (
      SELECT eligible_listing.id, ROW_NUMBER() OVER (ORDER BY ${ordering}) AS ordinal
      FROM listing eligible_listing WHERE ${predicate} AND eligible_listing.id NOT IN (${Prisma.join(featuredIds)})
    ), ranked AS (
      SELECT id, ordinal + (ordinal + 1) / 3 AS position FROM organic
      UNION ALL SELECT id, ordinal * 4 - 2 AS position
      FROM unnest(ARRAY[${Prisma.join(featuredIds)}]::text[]) WITH ORDINALITY AS priority(id, ordinal)
    )
    SELECT id FROM ranked ORDER BY position, id
    LIMIT ${pagination.take}::integer OFFSET ${pagination.skip}::integer
  `
}
