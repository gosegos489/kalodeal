import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PLAN_LIMITS, getPaidListingPlan } from '@/lib/plan-limits'
import { getSellerName, postingSince } from './public-profile'
import { getSellerCategoryFilters, getSellerCategoryIds } from './seller-categories'

const categories = [
  { id: 'root', name: 'Vehicles', slug: 'vehicles', parentId: null },
  { id: 'child', name: 'Cars', slug: 'cars', parentId: 'root' },
  { id: 'leaf', name: 'Electric', slug: 'electric', parentId: 'child' },
  { id: 'other', name: 'Electronics', slug: 'electronics', parentId: null }
]

test('seller categories aggregate descendant counts and filter only the selected hierarchy', () => {
  const result = getSellerCategoryFilters(categories, [
    { categoryId: 'root', count: 1 },
    { categoryId: 'leaf', count: 3 }
  ])
  assert.deepEqual(
    result.map(({ id, count }) => [id, count]),
    [
      ['root', 4],
      ['child', 3],
      ['leaf', 3]
    ]
  )
  assert.equal(result[2].label, 'Vehicles / Cars / Electric')
  assert.deepEqual(getSellerCategoryIds(categories, 'vehicles'), ['root', 'child', 'leaf'])
  assert.deepEqual(getSellerCategoryIds(categories, 'cars'), ['child', 'leaf'])
  assert.deepEqual(getSellerCategoryIds(categories, 'missing'), [])
  assert.deepEqual(getSellerCategoryFilters(categories, []), [])
})

test('posting since uses registration month in UTC; email-shaped legacy names stay private', () => {
  assert.equal(postingSince(new Date('2026-10-01T00:30:00Z')), 'Posting since October 2026')
  assert.equal(getSellerName('private@example.com'), 'Seller')
})

test('premium listing branding requires a live Business Plan, including paid cancellation periods', () => {
  const now = new Date('2026-10-15T00:00:00Z')
  const subscription = {
    plan: 'BUSINESS',
    status: 'ACTIVE',
    currentPeriodStart: new Date('2026-10-01'),
    currentPeriodEnd: new Date('2026-11-01')
  } as const
  assert.equal(PLAN_LIMITS[getPaidListingPlan(null, now)].businessNameEnabled, false)
  assert.equal(PLAN_LIMITS[getPaidListingPlan(subscription, now)].businessNameEnabled, true)
  assert.equal(PLAN_LIMITS[getPaidListingPlan({ ...subscription, status: 'CANCELED' }, now)].businessNameEnabled, true)
  for (const status of ['EXPIRED', 'PAST_DUE']) assert.equal(getPaidListingPlan({ ...subscription, status }, now), 'FREE')
  assert.equal(getPaidListingPlan({ ...subscription, currentPeriodEnd: now }, now), 'FREE')
  for (const plan of ['PLUS', 'PRO', 'FREE'] as const)
    assert.equal(PLAN_LIMITS[getPaidListingPlan({ ...subscription, plan }, now)].businessNameEnabled, false)
})
