import 'server-only'
import { getCategoryTree } from '@/entities/category/get-category-tree'
import type { ListingCategoryOption } from './types'

export async function getListingCategoryOptions(): Promise<ListingCategoryOption[]> {
  const categories = await getCategoryTree()

  return categories.flatMap((category) => [
    { id: category.id, name: category.name },
    ...category.children.flatMap((child) => [
      { id: child.id, name: `${category.name} / ${child.name}` },
      ...child.children.map((grandchild) => ({
        id: grandchild.id,
        name: `${category.name} / ${child.name} / ${grandchild.name}`
      }))
    ])
  ])
}
