import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { HomepageCategory } from '@/entities/category/get-homepage-categories'
import { CategoryCard } from '@/entities/category/ui/CategoryCard'

export function HomeCategories({ categories }: { categories: HomepageCategory[] }) {
  return (
    <section aria-labelledby="categories-heading">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="categories-heading" className="text-xl font-semibold sm:text-2xl">
            Browse Categories
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">Find your next deal, one category at a time.</p>
        </div>
        <Button nativeButton={false} variant="ghost" render={<Link href="/categories" />}>
          All categories <ArrowRight />
        </Button>
      </div>
      {categories.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {categories.map((category) => (
            <div key={category.id} className="bg-card overflow-hidden rounded-xl border">
              <CategoryCard {...category} image={category.icon} />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-sm">Categories are currently unavailable.</p>
      )}
    </section>
  )
}
