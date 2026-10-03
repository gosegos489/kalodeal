import 'server-only'

export class MultipartBodyError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
  }
}

export async function readMultipartFormData(request: Request, maxBytes: number, invalidMessage: string, tooLargeMessage: string) {
  const contentType = request.headers.get('content-type')
  if (!contentType?.startsWith('multipart/form-data') || !request.body) throw new MultipartBodyError(invalidMessage, 400)
  if (Number(request.headers.get('content-length')) > maxBytes) throw new MultipartBodyError(tooLargeMessage, 413)
  // Content-Length is optional and untrusted; enforce the actual streamed size.
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
        throw new MultipartBodyError(tooLargeMessage, 413)
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  try {
    return await new Response(new Uint8Array(Buffer.concat(chunks)), { headers: { 'content-type': contentType } }).formData()
  } catch {
    throw new MultipartBodyError(invalidMessage, 400)
  }
}
