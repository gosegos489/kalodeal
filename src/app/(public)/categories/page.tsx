import { Suspense } from 'react'
import { getCategoryTree } from '@/entities/category/get-category-tree'
import { CategorySection } from './_ui/CategorySection'
import { CategorySectionSkeleton } from './_ui/CategorySectionSkeleton'

export default async function CategoriesPage() {
  const categories = await getCategoryTree()

  return (
    <section className="container flex flex-col gap-10 p-6">
      {categories.map((category) => (
        <Suspense key={category.id} fallback={<CategorySectionSkeleton />}>
          <CategorySection category={category} />
        </Suspense>
      ))}
    </section>
  )
}
