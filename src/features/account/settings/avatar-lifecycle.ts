import { randomUUID } from 'node:crypto'
import { approvedAvatarObjectKey, approvedAvatarUrl, avatarKey, isOwnedAvatarObjectKey } from './avatar-reference'

export class AvatarError extends Error {}

export type AvatarState = {
  id: string
  image: string | null
  pendingAvatarKey: string | null
  avatarCleanupKey: string | null
}
type AvatarUpdate = Partial<Pick<AvatarState, 'image' | 'pendingAvatarKey' | 'avatarCleanupKey'>>

export interface AvatarRepository {
  locked<T>(userId: string, work: (state: AvatarState, save: (update: AvatarUpdate) => Promise<void>) => Promise<T>): Promise<T>
}

export interface AvatarStorage {
  put(key: string, bytes: Buffer, type: string): Promise<void>
  read(key: string): Promise<{ bytes: Buffer; type: string }>
  delete(key: string): Promise<void>
}

export function createAvatarLifecycle(repository: AvatarRepository, storage: AvatarStorage) {
  async function cleanup(userId: string) {
    await repository.locked(userId, async (state, save) => {
      const key = state.avatarCleanupKey
      if (!key) return
      if (!isOwnedAvatarObjectKey(userId, key) || key === state.pendingAvatarKey || key === approvedAvatarObjectKey(userId, state.image)) {
        throw new AvatarError('Avatar cleanup requires review. Please contact support.')
      }
      // Delete is idempotent. A failed DB commit leaves the marker for a safe retry.
      await storage.delete(key)
      await save({ avatarCleanupKey: null })
    })
  }

  async function tryCleanup(userId: string) {
    try {
      await cleanup(userId)
      return true
    } catch {
      return false
    }
  }

  async function upload(userId: string, bytes: Buffer, type: string) {
    await cleanup(userId)
    // Persist the obsolete reference BEFORE deletion. Storage outages cannot
    // produce untracked files, and another upload cannot accumulate versions.
    await repository.locked(userId, async (state, save) => {
      if (state.avatarCleanupKey) throw new AvatarError('Previous avatar cleanup is still in progress. Try again later.')
      if (state.pendingAvatarKey) {
        await save({ pendingAvatarKey: null, avatarCleanupKey: state.pendingAvatarKey })
      }
    })
    await cleanup(userId)

    const key = avatarKey(userId, randomUUID())
    // Reserve the reference in a committed transaction before touching storage.
    // Even a stopped process leaves the object reachable for removal/replacement.
    await repository.locked(userId, async (state, save) => {
      if (state.pendingAvatarKey || state.avatarCleanupKey) throw new AvatarError('Your avatar changed. Please try again.')
      await save({ pendingAvatarKey: key })
    })
    try {
      await repository.locked(userId, async (state) => {
        if (state.pendingAvatarKey !== key) throw new AvatarError('Your avatar changed. Please try again.')
        // Hold the user row lock during PUT so a replacement/rejection cannot
        // delete this reservation and then have an old request recreate it.
        await storage.put(key, bytes, type)
      })
    } catch (error) {
      await repository.locked(userId, async (state, save) => {
        if (state.pendingAvatarKey === key) {
          await save({ pendingAvatarKey: null, avatarCleanupKey: key })
        }
      })
      await tryCleanup(userId)
      throw error
    }
  }

  async function moderate(userId: string, version: string, decision: 'approve' | 'reject') {
    await cleanup(userId)
    await repository.locked(userId, async (state, save) => {
      if (state.avatarCleanupKey) throw new AvatarError('Previous avatar cleanup is still in progress. Try again later.')
      const pendingKey = avatarKey(userId, version)
      if (state.pendingAvatarKey !== pendingKey) throw new AvatarError('This pending avatar has changed. Refresh the moderation queue.')
      if (decision === 'approve') {
        // A reserved/incomplete/corrupt upload must not be approved.
        await storage.read(pendingKey)
        await save({
          image: approvedAvatarUrl(userId, version),
          pendingAvatarKey: null,
          avatarCleanupKey: approvedAvatarObjectKey(userId, state.image)
        })
      } else {
        await save({ pendingAvatarKey: null, avatarCleanupKey: pendingKey })
      }
    })
    // The newly assigned avatar is committed before the old approved object is
    // removed. Failure retains one durable marker and blocks further uploads.
    return tryCleanup(userId)
  }

  async function remove(userId: string) {
    await cleanup(userId)
    // Remove the pending version first, then the approved one, so a single
    // cleanup reference suffices and there can never be an orphaned collection.
    await repository.locked(userId, async (state, save) => {
      if (state.avatarCleanupKey) throw new AvatarError('Previous avatar cleanup is still in progress. Try again later.')
      if (state.pendingAvatarKey) await save({ pendingAvatarKey: null, avatarCleanupKey: state.pendingAvatarKey })
    })
    await cleanup(userId)
    await repository.locked(userId, async (state, save) => {
      if (state.pendingAvatarKey || state.avatarCleanupKey) throw new AvatarError('Your avatar changed. Please try again.')
      await save({ image: null, avatarCleanupKey: approvedAvatarObjectKey(userId, state.image) })
    })
    return tryCleanup(userId)
  }

  return { upload, moderate, remove, cleanup }
}
