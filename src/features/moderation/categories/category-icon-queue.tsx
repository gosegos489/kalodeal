import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CategoryIcon } from '@/entities/category/ui/category-icon'
import NuqsPagination from '@/shared/ui/NuqsPagination'
import { type CategoryIconSearchParams, getCategoryIconQueue } from './data'

export async function CategoryIconQueue(params: CategoryIconSearchParams) {
  const { categories, query, totalItems, totalPages } = await getCategoryIconQueue(params)
  return (
    <section aria-labelledby="category-icons-heading" className="min-w-0 space-y-6">
      <div>
        <h2 id="category-icons-heading" className="text-2xl font-semibold">
          Category icons
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">Upload, replace or remove icons for main categories and subcategories at every level.</p>
      </div>
      <form action="/moderator/categories" className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <label htmlFor="category-icon-search" className="text-sm font-medium">
            Search category name, slug, ID or parent
          </label>
          <Input id="category-icon-search" name="q" type="search" defaultValue={query} maxLength={150} />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>
      <p className="text-muted-foreground text-sm">{totalItems} categories</p>
      <div className="space-y-3">
        {categories.map((category) => (
          <article key={category.id} className="bg-card flex min-w-0 flex-wrap items-center gap-4 rounded-xl border p-4">
            <span className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-xl">
              <CategoryIcon value={category.icon} size={28} />
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <h3 className="font-medium wrap-anywhere">{category.name}</h3>
              <p className="text-muted-foreground text-xs wrap-anywhere">
                {category.parent ? `${category.parent.name} / ${category.name}` : 'Main category'} · {category.slug}
              </p>
              {!category.isActive && <Badge variant="outline">Inactive</Badge>}
            </div>
            <Button nativeButton={false} variant="outline" render={<Link href={`/moderator/categories/${category.id}`} prefetch={false} />}>
              Edit icon
            </Button>
          </article>
        ))}
        {!categories.length && <p className="text-muted-foreground rounded-xl border border-dashed p-6">No categories found.</p>}
      </div>
      <NuqsPagination totalPages={totalPages} ariaLabel="Category pages" />
    </section>
  )
}
