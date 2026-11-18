import assert from 'node:assert/strict'
import { setImmediate } from 'node:timers/promises'
import { test } from 'node:test'
import { enterOwnPresence } from './realtime-state'

test('presence waits for a successful attach and ignores a late attach after leaving', async () => {
  let entries = 0
  let leaves = 0
  const presence = {
    async enter() { entries++ },
    async leave() { leaves++ }
  }
  const failed = enterOwnPresence({ attach: () => Promise.reject(new Error('Unavailable')), presence })
  await setImmediate()
  failed()
  const pending = enterOwnPresence({ attach: () => Promise.resolve(), presence })
  pending()
  await setImmediate()
  assert.equal(entries, 0)
  assert.equal(leaves, 0)

  const active = enterOwnPresence({ attach: () => Promise.resolve(), presence })
  await setImmediate()
  assert.equal(entries, 1)
  active()
  assert.equal(leaves, 1)
})
