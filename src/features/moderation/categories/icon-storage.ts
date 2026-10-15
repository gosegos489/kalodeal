import { PutObjectCommand } from '@aws-sdk/client-s3'
import 'server-only'
import prisma from '@/lib/prisma'
import { deleteR2Objects } from '@/lib/r2-object-cleanup'
import { captureServerException } from '@/lib/sentry-server'
import { categoryIconUrl, getManagedCategoryIconKey } from './icon-reference'
import type { CategoryIconStorage } from './icon-workflow'

export const categoryIconStorage: CategoryIconStorage = {
  async reference(key) {
    const { R2_PUBLIC_URL } = await import('@/lib/r2')
    return categoryIconUrl(key, R2_PUBLIC_URL)
  },
  async upload(key, bytes, type) {
    const { r2, R2_BUCKET_NAME } = await import('@/lib/r2')
    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: bytes,
        ContentType: type,
        CacheControl: 'public, max-age=31536000, immutable'
      }),
      { abortSignal: AbortSignal.timeout(10000) }
    )
  },
  async cleanup(reference, categoryId) {
    try {
      // Non-managed legacy values need neither storage config nor deletion.
      if (!reference.includes(`/category-icons/${categoryId}/`)) return true
      const { R2_PUBLIC_URL } = await import('@/lib/r2')
      const key = getManagedCategoryIconKey(reference, R2_PUBLIC_URL, categoryId)
      if (!key) return true
      // This editor only creates fresh keys, never adopts an existing one, so an
      // unreferenced obsolete key cannot be reattached by another editor request.
      const references = await prisma.category.count({ where: { icon: { in: [reference, key, `/${key}`] } } })
      if (references) return true
      return await deleteR2Objects([key], 'category-icons')
    } catch (error) {
      await captureServerException(error, { feature: 'category-icons', operation: 'cleanup' })
      return false
    }
  }
}
