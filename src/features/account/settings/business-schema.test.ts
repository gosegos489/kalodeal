import assert from 'node:assert/strict'
import { test } from 'node:test'
import { businessDetailsSchema, emptyBusinessDetails } from './business-schema'

test('business details allow an empty profile, normalize text and bound every public field', () => {
  assert.equal(businessDetailsSchema.safeParse(emptyBusinessDetails).success, true)
  assert.equal(businessDetailsSchema.parse({ ...emptyBusinessDetails, description: '  Shop\nServices  ' }).description, 'Shop\nServices')
  for (const [field, max] of [
    ['description', 2000],
    ['address', 300],
    ['openingHours', 500]
  ] as const) {
    assert.equal(businessDetailsSchema.safeParse({ ...emptyBusinessDetails, [field]: 'x'.repeat(max + 1) }).success, false)
  }
})

test('business details reject unsafe URLs, markup, controls and ownership/role fields', () => {
  for (const website of ['javascript:alert(1)', 'data:text/html,x', 'ftp://example.com', 'https://user:password@example.com', '//example.com']) {
    assert.equal(businessDetailsSchema.safeParse({ ...emptyBusinessDetails, website }).success, false)
  }
  for (const website of ['https://example.com', 'http://example.com/shop'])
    assert.equal(businessDetailsSchema.safeParse({ ...emptyBusinessDetails, website }).success, true)
  for (const description of ['<script>alert(1)</script>', 'Shop\u0000', 'Shop\u202e'])
    assert.equal(businessDetailsSchema.safeParse({ ...emptyBusinessDetails, description }).success, false)
  for (const field of ['userId', 'id', 'role', 'accountType', 'pendingDetails'])
    assert.equal(businessDetailsSchema.safeParse({ ...emptyBusinessDetails, [field]: 'attacker' }).success, false)
})
