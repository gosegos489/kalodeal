import { randomUUID } from 'node:crypto'
import type { PrismaClient } from '@/generated/prisma/client'
import { canManageCategoryIcons } from '@/lib/auth-permissions'
import { hasActiveBan } from '@/lib/ban-status'
import { matchesImageType } from '@/lib/image-validation'
import { categoryIconFileSchema, categoryIconMutationSchema } from './schema'

export class CategoryIconError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message)
  }
}

type Actor = { id: string; role?: string | null; banned?: boolean | null; banExpires?: Date | null }
export interface CategoryIconStorage {
  reference(key: string): Promise<string>
  upload(key: string, bytes: Buffer, type: string): Promise<void>
  cleanup(reference: string, categoryId: string): Promise<boolean>
}

type Dependencies = {
  db: Pick<PrismaClient, 'category' | '$transaction'>
  actor(): Promise<Actor | null>
  storage: CategoryIconStorage
}

export function createCategoryIconOperations({ db, actor, storage }: Dependencies) {
  async function save(input: unknown, file?: unknown) {
    const user = await actor()
    if (!user) throw new CategoryIconError('Sign in to manage category icons.', 401)
    if (!canManageCategoryIcons(user.role) || hasActiveBan(user)) throw new CategoryIconError('Category icon management access is required.', 403)
    const parsed = categoryIconMutationSchema.safeParse(input)
    if (!parsed.success) throw new CategoryIconError('Invalid category or version. Reload this page.')
    const { categoryId, updatedAt, operation } = parsed.data
    let photo: { bytes: Buffer; type: string } | undefined
    if (operation === 'upload') {
      const image = categoryIconFileSchema.safeParse(file)
      if (!image.success) throw new CategoryIconError(image.error.issues[0].message)
      const bytes = Buffer.from(await image.data.arrayBuffer())
      if (!matchesImageType(bytes, image.data.type)) throw new CategoryIconError('Choose a valid PNG, WebP or JPEG image.')
      photo = { bytes, type: image.data.type }
    } else if (file !== undefined) {
      throw new CategoryIconError('Do not include an image when removing an icon.')
    }
    const category = await db.category.findUnique({ where: { id: categoryId }, select: { id: true, updatedAt: true } })
    if (!category) throw new CategoryIconError('This category no longer exists.', 404)
    if (category.updatedAt.toISOString() !== updatedAt) throw new CategoryIconError('This category has changed. Reload it before saving.', 409)

    let newReference: string | null = null
    let saved: { icon: string | null; updatedAt: Date; oldIcon: string | null }
    try {
      if (photo) {
        const extension = photo.type === 'image/jpeg' ? 'jpg' : photo.type === 'image/png' ? 'png' : 'webp'
        const key = `category-icons/${categoryId}/${randomUUID()}.${extension}`
        // Remember the reference before PUT; a transport failure can be ambiguous.
        newReference = await storage.reference(key)
        await storage.upload(key, photo.bytes, photo.type)
      }
      saved = await db.$transaction(async (tx) => {
        // Preserve user -> category lock order and fresh authorization at commit.
        await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${user.id} FOR SHARE`
        const currentActor = await tx.user.findUnique({ where: { id: user.id }, select: { role: true, banned: true, banExpires: true } })
        if (!currentActor || !canManageCategoryIcons(currentActor.role) || hasActiveBan(currentActor))
          throw new CategoryIconError('Category icon management access is required.', 403)
        await tx.$queryRaw`SELECT id FROM category WHERE id = ${categoryId} FOR UPDATE`
        const current = await tx.category.findUnique({ where: { id: categoryId }, select: { icon: true, updatedAt: true } })
        if (!current) throw new CategoryIconError('This category no longer exists.', 404)
        if (current.updatedAt.toISOString() !== updatedAt) throw new CategoryIconError('This category has changed. Reload it before saving.', 409)
        const version = new Date(Math.max(Date.now(), current.updatedAt.getTime() + 1))
        const changed = await tx.category.updateMany({
          where: { id: categoryId, updatedAt: current.updatedAt },
          data: { icon: newReference, updatedAt: version }
        })
        if (changed.count !== 1) throw new CategoryIconError('This category has changed. Reload it before saving.', 409)
        return { icon: newReference, updatedAt: version, oldIcon: current.icon }
      })
    } catch (error) {
      if (newReference) {
        // The adapter checks all category references, also protecting an uncertain
        // DB commit. If that check fails it retains the object for reconciliation.
        await storage.cleanup(newReference, categoryId).catch(() => false)
      }
      throw error
    }
    let cleaned = true
    if (saved.oldIcon && saved.oldIcon !== saved.icon) cleaned = await storage.cleanup(saved.oldIcon, categoryId).catch(() => false)
    return { icon: saved.icon, updatedAt: saved.updatedAt.toISOString(), cleaned }
  }
  return { save }
}
