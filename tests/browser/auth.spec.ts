import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { expect, test, type Locator, type Page } from '@playwright/test'

async function fillAfterHydration(field: Locator, value: string) {
  // The server-rendered input is already editable. React mirrors a controlled
  // value to the value attribute once its change handler has processed the input.
  await expect.poll(async () => {
    await field.fill(value)
    return (await field.getAttribute('value')) === value
  }, { message: 'Expected the form to accept the input after hydration' }).toBe(true)
}

async function interruptSubmit(page: Page, submit: Locator, endpoint: string, title: string) {
  const path = '/api/auth/' + endpoint
  await page.route(path, route => route.abort('internetdisconnected'), { times: 1 })
  const [failed] = await Promise.all([
    page.waitForEvent('requestfailed', request => request.method() === 'POST' && new URL(request.url()).pathname === path),
    submit.click()
  ])
  expect(await failed.response()).toBeNull()
  const toast = page.locator('[data-slot="toast"]').filter({ hasText: title })
  await expect(toast).toContainText('Check your connection and try again.')
  await expect(toast).toBeVisible()
  await expect(submit).toBeEnabled()
}

async function retrySubmit(page: Page, submit: Locator, endpoint: string) {
  const [response] = await Promise.all([
    page.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/auth/' + endpoint),
    submit.click()
  ])
  expect(response.status()).toBe(200)
}

test('AUTH-04 retries both password recovery forms after a network failure', async ({ page, baseURL }) => {
  const email = process.env.QA_RESET_EMAIL
  const mailbox = process.env.QA_MAIL_FILE
  if (!email || !mailbox) throw new Error('Set QA_RESET_EMAIL to a dedicated QA account and QA_MAIL_FILE to its local JSONL mailbox.')

  const previousMail = await readFile(mailbox, 'utf8')
  await page.goto('/forgot-password')
  const requestLink = page.getByRole('button', { name: 'Send reset link', exact: true })
  await expect(requestLink).toBeEnabled()
  const emailField = page.getByLabel('Email', { exact: true })
  await fillAfterHydration(emailField, email)
  await interruptSubmit(page, requestLink, 'request-password-reset', 'Unable to send reset link')
  await expect(emailField).toHaveValue(email)
  await retrySubmit(page, requestLink, 'request-password-reset')
  await expect(page.getByText('Check your email', { exact: true })).toBeVisible()

  let resetLink: string | undefined
  await expect.poll(async () => {
    const newMail = (await readFile(mailbox, 'utf8')).slice(previousMail.length)
    for (const line of newMail.trim().split('\n').filter(Boolean)) {
      const message = JSON.parse(line)
      if ([message.to].flat().includes(email) && message.subject === 'Reset your KaloDeal password') {
        resetLink = message.html.match(/href="([^"]*\/api\/auth\/reset-password\/[^"]+)"/)?.[1]?.replaceAll('&amp;', '&')
        if (resetLink) return true
      }
    }
    return false
  }, { message: 'Expected a fresh reset link in the local test email' }).toBe(true)

  const link = new URL(resetLink!)
  expect(link.origin).toBe(baseURL)
  await page.goto(link.href)
  const updatePassword = page.getByRole('button', { name: 'Update password', exact: true })
  await expect(updatePassword).toBeEnabled()
  const password = 'Qa!' + randomUUID().slice(0, 16)
  const passwordField = page.getByLabel('Password', { exact: true })
  const confirmation = page.getByLabel('Confirm password', { exact: true })
  await fillAfterHydration(passwordField, password)
  await confirmation.fill(password)
  await interruptSubmit(page, updatePassword, 'reset-password', 'Unable to reset password')
  await expect(passwordField).toHaveValue(password)
  await expect(confirmation).toHaveValue(password)
  await retrySubmit(page, updatePassword, 'reset-password')
  await expect(page).toHaveURL('/login')
  expect((await page.request.post('/api/auth/sign-in/email', { data: { email, password } })).status()).toBe(200)
})
