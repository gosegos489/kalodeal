import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto'
import { matchesImageType } from '@/lib/image-validation'

const types = ['image/jpeg', 'image/png', 'image/webp'] as const
const header = Buffer.from('KDA1')

function encryptionKey(secret: string) {
  if (!secret.trim()) throw new Error('AVATAR_ENCRYPTION_SECRET is required for avatar storage.')
  return Buffer.from(hkdfSync('sha256', secret, 'kalodeal-avatars-v1', 'private-images', 32))
}

// The existing R2 bucket is public. Only these authenticated envelopes go there,
// so discovering a pending object's key never exposes the pending image.
export function encryptAvatar(bytes: Buffer, type: string, key: string, secret: string) {
  const typeIndex = types.indexOf(type as (typeof types)[number])
  if (typeIndex === -1 || !matchesImageType(bytes, type)) throw new Error('Invalid avatar image.')
  const nonce = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(secret), nonce)
  cipher.setAAD(Buffer.from(key))
  const ciphertext = Buffer.concat([cipher.update(bytes), cipher.final()])
  return Buffer.concat([header, Buffer.from([typeIndex]), nonce, cipher.getAuthTag(), ciphertext])
}

export function decryptAvatar(envelope: Buffer, key: string, secret: string) {
  if (!envelope.subarray(0, 4).equals(header) || envelope.length < 34 || !types[envelope[4]]) throw new Error('Invalid avatar object.')
  const type = types[envelope[4]]
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(secret), envelope.subarray(5, 17))
  decipher.setAAD(Buffer.from(key))
  decipher.setAuthTag(envelope.subarray(17, 33))
  const bytes = Buffer.concat([decipher.update(envelope.subarray(33)), decipher.final()])
  if (!matchesImageType(bytes, type)) throw new Error('Invalid avatar image.')
  return { bytes, type }
}
