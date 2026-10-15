import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { getListingWhere } from '@/entities/listing/listing-where'
import { listingFiltersSchema } from '@/entities/listing/schema'
import { createListingSchema, listingDetailsSchema } from '@/features/create-listing/schema'
import { listingModerationSchema } from '@/features/moderation/listings/schema'
import { CYPRUS_LOCATIONS, formatLocation, getAreas, isAreaInDistrict } from './catalog'
import { listingLocationSchema } from './schema'

const details = {
  title: 'A useful item',
  description: 'A useful item in excellent condition.',
  categoryId: 'example-category',
  price: '',
  currency: 'EUR',
  phone: '+357 99 123456',
  youtube: '',
  facebookUrl: '',
  messengerUrl: ''
}
const reference = { id: '12e369b4-d3b8-4bf9-b837-15993d206948', updatedAt: '2026-10-15T10:00:00.000Z', decision: 'change-location' }

test('catalogue has exactly five districts and 102 unique areas', () => {
  assert.deepEqual(
    CYPRUS_LOCATIONS.map(({ areas }) => areas.length),
    [19, 24, 22, 22, 15]
  )
  const slugs = CYPRUS_LOCATIONS.flatMap(({ areas }) => areas.map(([slug]) => slug))
  assert.equal(slugs.length, 102)
  assert.equal(new Set(slugs).size, 102)
  assert.deepEqual(getAreas('unknown'), [])
})

test('every catalogue pair works for publishing, owner edits, moderation and filtering', () => {
  for (const district of CYPRUS_LOCATIONS) {
    for (const [area, label] of district.areas) {
      const location = { district: district.slug, area }
      assert.equal(listingLocationSchema.safeParse(location).success, true)
      assert.equal(createListingSchema().safeParse({ ...details, ...location }).success, true)
      assert.equal(listingDetailsSchema.strict().safeParse({ ...details, ...location }).success, true)
      assert.equal(listingModerationSchema.safeParse({ ...reference, ...location }).success, true)
      assert.equal(listingFiltersSchema.safeParse(location).success, true)
      assert.equal(formatLocation(location), `${label}, ${district.name}`)
      for (const other of CYPRUS_LOCATIONS.filter(({ slug }) => slug !== district.slug)) {
        const invalid = { district: other.slug, area }
        assert.equal(isAreaInDistrict(other.slug, area), false)
        assert.equal(createListingSchema().safeParse({ ...details, ...invalid }).success, false)
        assert.equal(listingDetailsSchema.strict().safeParse({ ...details, ...invalid }).success, false)
        assert.equal(listingModerationSchema.safeParse({ ...reference, ...invalid }).success, false)
        assert.equal(listingFiltersSchema.safeParse(invalid).success, false)
      }
    }
  }
})

test('missing, arbitrary and malformed locations cannot be saved', () => {
  for (const location of [
    {},
    { district: 'limassol' },
    { area: 'germasogeia' },
    { district: '', area: '' },
    { district: null, area: null },
    { district: 'unknown', area: 'germasogeia' },
    { district: 'limassol', area: 'unknown' },
    { district: ['limassol'], area: 'germasogeia' }
  ]) {
    assert.equal(createListingSchema().safeParse({ ...details, ...location }).success, false)
    assert.equal(listingDetailsSchema.strict().safeParse({ ...details, ...location }).success, false)
    assert.equal(listingModerationSchema.safeParse({ ...reference, ...location }).success, false)
  }
  assert.equal(listingFiltersSchema.safeParse({ district: ['limassol'] }).success, false)
  assert.equal(listingFiltersSchema.safeParse({ area: 'germasogeia' }).success, false)
})

test('geography combines with text and category through AND without changing visibility', () => {
  const filters = listingFiltersSchema.parse({ query: ' bicycle ', category: 'sports', district: 'limassol', area: 'germasogeia' })
  assert.deepEqual(getListingWhere(filters), {
    status: 'ACTIVE',
    district: 'limassol',
    area: 'germasogeia',
    OR: [{ title: { contains: 'bicycle', mode: 'insensitive' } }, { description: { contains: 'bicycle', mode: 'insensitive' } }],
    category: {
      OR: [{ slug: 'sports' }, { parent: { is: { slug: 'sports' } } }, { parent: { is: { parent: { is: { slug: 'sports' } } } } }]
    }
  })
  assert.deepEqual(getListingWhere(listingFiltersSchema.parse({ district: 'limassol' })), { status: 'ACTIVE', district: 'limassol' })
  // No location condition excludes legacy records when browsing without geography.
  assert.deepEqual(getListingWhere(listingFiltersSchema.parse({})), { status: 'ACTIVE' })
  assert.equal(formatLocation({ district: null, area: null }), null)
  assert.equal(formatLocation({ district: 'unknown', area: 'unknown' }), null)
  assert.equal(formatLocation({ district: 'limassol', area: null }), 'Limassol District')
})

test('offline database constraint snapshot exactly matches the catalogue', () => {
  const sql = readFileSync(new URL('../../../prisma/migrations/20261015120000_listing_locations/migration.sql', import.meta.url), 'utf8')
  const groups = [...sql.matchAll(/"district" = '([^']+)' AND "area" IN \(([^)]+)\)/g)]
  assert.equal(groups.length, 5)
  for (const [index, [, slug, values]] of groups.entries()) {
    assert.equal(slug, CYPRUS_LOCATIONS[index].slug)
    assert.deepEqual(
      [...values.matchAll(/'([^']+)'/g)].map((match) => match[1]),
      CYPRUS_LOCATIONS[index].areas.map(([area]) => area)
    )
  }
  assert.match(sql, /"district" IS NULL AND "area" IS NULL/)
  assert.match(sql, /"district" IS NOT NULL AND "area" IS NOT NULL/)
})
