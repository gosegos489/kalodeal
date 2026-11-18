import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'

test('AUTH-02 explains an expired verification link and keeps the visitor signed out', async ({ page, baseURL }) => {
  const email = process.env.QA_EXPIRED_EMAIL
  const mailbox = process.env.QA_MAIL_FILE
  if (!email || !mailbox) throw new Error('Set QA_EXPIRED_EMAIL and QA_MAIL_FILE for an unverified fixture with an expired registration email.')

  const lines = (await readFile(mailbox, 'utf8')).trim().split('\n')
  const message = lines.map(line => JSON.parse(line)).findLast(mail =>
    [mail.to].flat().includes(email) && mail.subject === 'Verify your KaloDeal email address'
  )
  const href = message?.html.match(/href="([^"]+\/api\/auth\/verify-email\?[^"]+)"/)?.[1]
  if (!href) throw new Error('Registration email with verification link missing.')
  const link = new URL(href.replaceAll('&amp;', '&'))
  expect(link.origin).toBe(baseURL)
  const claims = JSON.parse(Buffer.from(link.searchParams.get('token')!.split('.')[1], 'base64url').toString())
  expect(claims.email).toBe(email)
  expect(claims.exp).toBeLessThan(Date.now() / 1000)

  const [verification, destination] = await Promise.all([
    page.waitForResponse(response => response.url() === link.href),
    page.goto(link.href)
  ])
  expect(verification.status()).toBe(302)
  expect(destination?.status()).toBe(200)
  const session = await page.request.get('/api/auth/get-session')
  expect(session.status()).toBe(200)
  expect(await session.json()).toBeNull()
  await expect(page).toHaveURL('/login?error=TOKEN_EXPIRED')
  await expect(page.getByRole('alert').filter({ hasText: 'Your email verification link has expired.' })).toContainText('Sign in to receive a new link.')
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible()
})
