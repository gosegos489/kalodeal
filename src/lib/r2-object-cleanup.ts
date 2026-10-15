import { DeleteObjectsCommand } from '@aws-sdk/client-s3'
import 'server-only'
import { captureServerException } from '@/lib/sentry-server'

export async function deleteR2Objects(keys: string[], feature: string): Promise<boolean> {
  if (!keys.length) return true
  let pending = [...new Set(keys)]
  // HTTP 200 can still contain per-object errors. Retry only outstanding keys.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { r2, R2_BUCKET_NAME } = await import('@/lib/r2')
      const result = await r2.send(new DeleteObjectsCommand({ Bucket: R2_BUCKET_NAME, Delete: { Objects: pending.map((Key) => ({ Key })) } }), {
        abortSignal: AbortSignal.timeout(5000)
      })
      if (!result.Errors?.length) return true
      const failed = new Set(result.Errors.map((error) => error.Key))
      if (!failed.has(undefined)) pending = pending.filter((key) => failed.has(key))
      if (!pending.length) return true
    } catch {
      // Deletion is idempotent; transport errors retry the outstanding batch.
    }
  }
  await captureServerException(new Error('R2 object cleanup failed after retries'), { feature, operation: 'cleanup' })
  console.error('Could not clean up storage objects after retries.')
  return false
}
