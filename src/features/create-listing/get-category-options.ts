import 'server-only'
import { getCategoryTree } from '@/entities/category/get-category-tree'
import type { ListingCategoryOption } from './types'

export async function getListingCategoryOptions(): Promise<ListingCategoryOption[]> {
  const categories = await getCategoryTree()

  return categories.flatMap((category) => [
    { id: category.id, name: category.name, slug: category.slug, parentId: null },
    ...category.children.flatMap((child) => [
      { id: child.id, name: `${category.name} / ${child.name}`, slug: child.slug, parentId: category.id },
      ...child.children.map((grandchild) => ({
        id: grandchild.id,
        name: `${category.name} / ${child.name} / ${grandchild.name}`,
        slug: grandchild.slug,
        parentId: child.id
      }))
    ])
  ])
}
