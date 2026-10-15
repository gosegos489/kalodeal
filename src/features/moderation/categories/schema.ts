import { z } from 'zod'

export const CATEGORY_ICON_MAX_BYTES = 1024 * 1024
export const CATEGORY_ICON_BODY_MAX_BYTES = CATEGORY_ICON_MAX_BYTES + 16 * 1024
export const CATEGORY_ICON_TYPES = ['image/png', 'image/webp', 'image/jpeg'] as const
export const categoryIdSchema = z.string().cuid()
export const categoryIconMutationSchema = z
  .object({
    categoryId: categoryIdSchema,
    updatedAt: z.iso.datetime(),
    operation: z.enum(['upload', 'remove'])
  })
  .strict()
export const categoryIconFileSchema = z
  .file()
  .min(1, 'Choose an image.')
  .max(CATEGORY_ICON_MAX_BYTES, 'Use an icon no larger than 1 MB.')
  .mime([...CATEGORY_ICON_TYPES], 'Choose a PNG, WebP or JPEG image.')
export const categoryIconResponseSchema = z.discriminatedUnion('success', [
  z.object({ success: z.literal(true), message: z.string(), icon: z.string().nullable(), updatedAt: z.iso.datetime() }),
  z.object({ success: z.literal(false), message: z.string() })
])
