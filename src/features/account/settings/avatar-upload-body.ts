import { MAX_IMAGE_BYTES } from '@/features/create-listing/schema'
import { readMultipartFormData } from '@/lib/read-multipart-form-data'

export { MultipartBodyError as AvatarBodyError } from '@/lib/read-multipart-form-data'

export async function readAvatarFormData(request: Request) {
  return readMultipartFormData(request, MAX_IMAGE_BYTES + 64 * 1024, 'Invalid avatar upload.', 'Use an image no larger than 5 MB.')
}
