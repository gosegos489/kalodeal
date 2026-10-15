import assert from 'node:assert/strict'
import { test } from 'node:test'
import { decryptAvatar, encryptAvatar } from './avatar-crypto'
import { type AvatarRepository, type AvatarState, type AvatarStorage, createAvatarLifecycle } from './avatar-lifecycle'
import { approvedAvatarUrl, avatarVersion } from './avatar-reference'

function fixture() {
  const state: AvatarState = { id: 'seller', image: null, pendingAvatarKey: null, avatarCleanupKey: null, avatarModerationMessage: null }
  const objects = new Map<string, Buffer>()
  let failDelete = false
  let failPut = false
  let tail = Promise.resolve()
  const repository: AvatarRepository = {
    async locked(userId, work) {
      assert.equal(userId, state.id)
      const previous = tail
      let release = () => {}
      tail = new Promise<void>((resolve) => {
        release = resolve
      })
      await previous
      const draft = { ...state }
      try {
        const result = await work(draft, async (data) => {
          Object.assign(draft, data)
        })
        Object.assign(state, draft)
        return result
      } finally {
        release()
      }
    }
  }
  const storage: AvatarStorage = {
    async put(key, bytes, type) {
      objects.set(key, encryptAvatar(bytes, type, key, 'offline-test-secret'))
      if (failPut) throw new Error('Storage unavailable after write')
    },
    async read(key) {
      const envelope = objects.get(key)
      if (!envelope) throw new Error('Missing object')
      return decryptAvatar(envelope, key, 'offline-test-secret')
    },
    async delete(key) {
      if (failDelete) throw new Error('Storage unavailable')
      objects.delete(key)
    }
  }
  return {
    state,
    objects,
    lifecycle: createAvatarLifecycle(repository, storage),
    failDelete(value: boolean) {
      failDelete = value
    },
    failPut(value: boolean) {
      failPut = value
    }
  }
}
const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3])

test('shared business logo lifecycle keeps encrypted uploads pending until an explicit review', async () => {
  const f = fixture()
  await f.lifecycle.upload('seller', png, 'image/png')
  assert.equal(f.state.image, null)
  assert.ok(f.state.pendingAvatarKey)
  const key = f.state.pendingAvatarKey
  const envelope = f.objects.get(key)
  assert.ok(envelope)
  assert.notDeepEqual(envelope, png)
  assert.throws(() => decryptAvatar(envelope, key + '-wrong', 'offline-test-secret'))
  const version = avatarVersion('seller', key)
  assert.ok(version)
  await f.lifecycle.moderate('seller', version, { decision: 'approve' })
  assert.equal(f.state.image, approvedAvatarUrl('seller', version))
  assert.equal(f.state.pendingAvatarKey, null)
  await assert.rejects(f.lifecycle.moderate('seller', version, { decision: 'approve' }), /changed/)
})

test('logo rejection preserves approved image and durable cleanup survives storage failure', async () => {
  const f = fixture()
  await f.lifecycle.upload('seller', png, 'image/png')
  const first = avatarVersion('seller', f.state.pendingAvatarKey ?? '')
  assert.ok(first)
  await f.lifecycle.moderate('seller', first, { decision: 'approve' })
  await f.lifecycle.upload('seller', png, 'image/png')
  const second = avatarVersion('seller', f.state.pendingAvatarKey ?? '')
  assert.ok(second)
  f.failDelete(true)
  assert.equal(await f.lifecycle.moderate('seller', second, { decision: 'request-changes', message: 'Use a clear logo.' }), false)
  assert.equal(f.state.image, approvedAvatarUrl('seller', first))
  assert.equal(f.state.avatarModerationMessage, 'Use a clear logo.')
  assert.ok(f.state.avatarCleanupKey)
  await assert.rejects(f.lifecycle.upload('seller', png, 'image/png'))
  f.failDelete(false)
  await f.lifecycle.cleanup('seller')
  assert.equal(f.state.avatarCleanupKey, null)
  assert.equal(f.objects.size, 1)
  await f.lifecycle.remove('seller')
  assert.equal(f.state.image, null)
  assert.equal(f.objects.size, 0)
})

test('failed and concurrent logo uploads leave only tracked objects', async () => {
  const f = fixture()
  f.failPut(true)
  await assert.rejects(f.lifecycle.upload('seller', png, 'image/png'))
  assert.equal(f.state.pendingAvatarKey, null)
  assert.equal(f.objects.size, 0)
  f.failPut(false)
  await Promise.allSettled([f.lifecycle.upload('seller', png, 'image/png'), f.lifecycle.upload('seller', png, 'image/png')])
  const references = new Set([f.state.pendingAvatarKey, f.state.avatarCleanupKey].filter(Boolean))
  assert.ok(f.objects.size > 0)
  for (const key of f.objects.keys()) assert.ok(references.has(key))
})
