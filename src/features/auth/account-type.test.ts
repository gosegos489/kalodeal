import { memoryAdapter } from 'better-auth/adapters/memory'
import { betterAuth } from 'better-auth/minimal'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import z from 'zod'
import { accountTypeSchema } from '@/entities/user/account-type'
import { guardAuthAccountType, guardAuthProfileData } from '@/features/account/settings/auth-profile'

test('account type and auth profile guards reject privilege and moderation bypasses', () => {
  for (const value of ['admin', 'moderator', 'business', '', null, [], {}, 1]) {
    assert.equal(accountTypeSchema.safeParse(value).success, false)
    assert.throws(() => guardAuthAccountType({ accountType: value }, false, true))
  }
  for (const role of ['admin', 'moderator', 'user', null]) assert.throws(() => guardAuthAccountType({ role }, false, true))
  for (const accountType of ['PERSONAL', 'BUSINESS']) {
    assert.doesNotThrow(() => guardAuthAccountType({ accountType }, false, true))
    assert.throws(() => guardAuthAccountType({ accountType }, true, false))
  }
  for (const key of ['image', 'pendingName', 'pendingBusinessName', 'businessName', 'businessProfile', 'pendingAvatarKey']) {
    assert.throws(() => guardAuthProfileData({ [key]: 'unreviewed' }, false))
  }
})

test('installed Better Auth persists both account types, defaults old clients, and still requires email verification', async () => {
  // No network clients are called. Replace persistence and email delivery before
  // invoking the real application hooks and Better Auth endpoint implementation.
  process.env.RESEND_API_KEY = 're_offline_test'
  const { auth } = await import('@/lib/auth')
  const database = { user: [], session: [], account: [], verification: [] }
  const emails: string[] = []
  const testAuth = betterAuth({
    ...auth.options,
    baseURL: 'http://localhost:3000',
    trustedOrigins: ['http://localhost:3000'],
    secret: 'offline-account-type-test-secret-at-least-32-characters',
    database: memoryAdapter(database),
    rateLimit: { enabled: false },
    emailAndPassword: { ...auth.options.emailAndPassword, enabled: true, sendResetPassword: async () => {} },
    emailVerification: {
      ...auth.options.emailVerification,
      sendVerificationEmail: async ({ url }) => {
        emails.push(url)
      }
    }
  })
  const post = (path: string, body: unknown, cookie?: string) =>
    testAuth.handler(
      new Request(`http://localhost:3000/api/auth${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: 'http://localhost:3000', ...(cookie ? { cookie } : {}) },
        body: JSON.stringify(body)
      })
    )
  const password = 'OfflinePassword123!'
  for (const [index, accountType] of ['PERSONAL', 'BUSINESS', undefined].entries()) {
    const email = `seller-${index}@example.test`
    const signup = await post('/sign-up/email', { name: 'Test Seller', email, password, ...(accountType ? { accountType } : {}) })
    assert.equal(signup.status, 200, await signup.clone().text())
    const user = z
      .object({
        id: z.string(),
        email: z.string(),
        accountType: accountTypeSchema,
        role: z.string(),
        emailVerified: z.boolean(),
        name: z.string(),
        pendingName: z.string()
      })
      .parse(database.user.find((row: { email: string }) => row.email === email))
    assert.equal(user.accountType, accountType ?? 'PERSONAL')
    assert.equal(user.role, 'user')
    assert.equal(user.emailVerified, false)
    assert.equal(user.name, '')
    assert.equal(user.pendingName, 'Test Seller')
    assert.equal((await post('/sign-in/email', { email, password })).status, 403)
    const verificationUrl = emails.at(-1)
    assert.ok(verificationUrl)
    const verification = await testAuth.handler(new Request(verificationUrl))
    assert.ok([200, 302].includes(verification.status))
    const login = await post('/sign-in/email', { email, password })
    assert.equal(login.status, 200)
    const cookie = login.headers
      .getSetCookie()
      .map((value) => value.split(';')[0])
      .join('; ')
    assert.ok(cookie)
    assert.equal((await post('/update-user', { accountType: 'BUSINESS' }, cookie)).status, 400)
    assert.equal((await post('/update-user', { businessName: 'Unreviewed' }, cookie)).status, 400)
  }
  for (const extra of [{ accountType: 'ADMIN' }, { accountType: null }, { role: 'admin' }, { role: 'moderator' }]) {
    assert.equal((await post('/sign-up/email', { name: '', email: 'attacker@example.test', password, ...extra })).status, 400)
  }
  assert.equal(database.user.length, 3)
  assert.equal(auth.options.emailAndPassword?.requireEmailVerification, true)
  assert.equal(auth.options.rateLimit?.enabled, true)
})
