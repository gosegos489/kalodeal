import { getMessages } from 'next-intl/server'
import 'server-only'
import { getCategoryTree } from '@/entities/category/get-category-tree'
import { categoryName } from '@/i18n/category-name'
import type { ListingCategoryOption } from './types'

export async function getListingCategoryOptions(): Promise<ListingCategoryOption[]> {
  const [categories, messages] = await Promise.all([getCategoryTree(), getMessages()])
  const name = (category: { name: string; slug: string }) => categoryName(category, messages.CategoryNames)

  return categories.flatMap((category) => [
    { id: category.id, name: name(category), slug: category.slug, parentId: null },
    ...category.children.flatMap((child) => [
      { id: child.id, name: `${name(category)} / ${name(child)}`, slug: child.slug, parentId: category.id },
      ...child.children.map((grandchild) => ({
        id: grandchild.id,
        name: `${name(category)} / ${name(child)} / ${name(grandchild)}`,
        slug: grandchild.slug,
        parentId: child.id
      }))
    ])
  ])
}
