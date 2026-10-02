import { MAX_IMAGE_BYTES } from '@/features/create-listing/schema'

export class AvatarBodyError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
  }
}

export async function readAvatarFormData(request: Request) {
  const maxBytes = MAX_IMAGE_BYTES + 64 * 1024
  const contentType = request.headers.get('content-type')
  if (!contentType?.startsWith('multipart/form-data') || !request.body) throw new AvatarBodyError('Choose an avatar image.', 400)
  if (Number(request.headers.get('content-length')) > maxBytes) throw new AvatarBodyError('Use an image no larger than 5 MB.', 413)
  // Count streamed bytes too: Content-Length is optional and untrusted.
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maxBytes) {
        await reader.cancel()
        throw new AvatarBodyError('Use an image no larger than 5 MB.', 413)
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  try {
    return await new Response(new Uint8Array(Buffer.concat(chunks)), { headers: { 'content-type': contentType } }).formData()
  } catch {
    throw new AvatarBodyError('Invalid avatar upload.', 400)
  }
}
