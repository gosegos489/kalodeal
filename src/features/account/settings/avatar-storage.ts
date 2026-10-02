import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import 'server-only'
import { MAX_IMAGE_BYTES } from '@/features/create-listing/schema'
import { decryptAvatar, encryptAvatar } from './avatar-crypto'
import type { AvatarStorage } from './avatar-lifecycle'

function getAvatarEncryptionSecret() {
  const secret = process.env.AVATAR_ENCRYPTION_SECRET
  if (!secret?.trim()) throw new Error('AVATAR_ENCRYPTION_SECRET is required for avatar storage.')
  return secret
}

export const avatarStorage: AvatarStorage = {
  async put(key, bytes, type) {
    const body = encryptAvatar(bytes, type, key, getAvatarEncryptionSecret())
    const { r2, R2_BUCKET_NAME } = await import('@/lib/r2')
    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: 'application/octet-stream',
        CacheControl: 'no-store'
      }),
      { abortSignal: AbortSignal.timeout(8000) }
    )
  },
  async read(key) {
    const secret = getAvatarEncryptionSecret()
    const { r2, R2_BUCKET_NAME } = await import('@/lib/r2')
    const object = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }), { abortSignal: AbortSignal.timeout(8000) })
    if (!object.Body || !object.ContentLength || object.ContentLength > MAX_IMAGE_BYTES + 33) throw new Error('Invalid avatar object.')
    const envelope = Buffer.from(await object.Body.transformToByteArray())
    return decryptAvatar(envelope, key, secret)
  },
  async delete(key) {
    const { r2, R2_BUCKET_NAME } = await import('@/lib/r2')
    await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }), { abortSignal: AbortSignal.timeout(8000) })
  }
}
