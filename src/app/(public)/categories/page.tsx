import { CategoryCard } from '@/entities/category/ui/CategoryCard'
import { getCategorySummaries } from '@/entities/category/get-category-tree'
import { BreadCrumbs } from '@/shared/ui/BreadCrumbs'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, MoveRight, Tag } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Categories',
  description: 'Browse categories and find local listings on Kalodeal.'
}

export default async function CategoriesPage() {
  const categories = await getCategorySummaries()
  const listingsCount = categories.reduce((total, category) => total + category.listingCount, 0)

  return (
    <div className="container flex flex-col gap-4 py-10">
      <div className="flex flex-col gap-4">
        <BreadCrumbs items={[{ label: 'Home', href: '/' }, { label: 'Categories' }]} />
        <h1 className="text-xl font-bold md:text-3xl">Find what you’re looking for across Kalodeal</h1>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">
              Browse <span className="text-primary">{listingsCount}</span> active listings
            </p>
          </div>

          <Link href="/" className="text-primary flex items-center gap-2 font-semibold">
            <p>View all listings</p> <MoveRight className="size-4" />
          </Link>
        </div>

        {categories.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {categories.map((category) => (
              <section key={category.id} className="border-border bg-card overflow-hidden rounded-xl border">
                <div className="grid grid-cols-1 sm:grid-cols-[minmax(11rem,0.8fr)_minmax(0,1.2fr)]">
                  <CategoryCard {...category} />

                  <div className="border-border flex min-w-0 flex-col gap-3 border-t p-4 sm:border-t-0 sm:border-l">
                    <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                      Subcategories
                    </p>

                    {category.children.length > 0 ? (
                      <ul className="grid gap-2 sm:grid-cols-2">
                        {category.children.map((child) => (
                          <li key={child.id} className="min-w-0">
                            <Link
                              href={`/?category=${child.slug}`}
                              className="hover:text-primary focus-visible:ring-ring/50 flex items-center gap-1 rounded-sm text-sm font-medium outline-none focus-visible:ring-2"
                            >
                              <span className="bg-muted text-muted-foreground flex size-5 shrink-0 items-center justify-center rounded">
                                {child.image ? (
                                  <Image src={child.image} alt="" width={12} height={12} className="size-3 object-contain" />
                                ) : (
                                  <Tag className="size-3" aria-hidden="true" />
                                )}
                              </span>
                              <span className="truncate">{child.name}</span>
                              <ChevronRight className="text-muted-foreground size-3.5 shrink-0" aria-hidden="true" />
                            </Link>

                            {child.children.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1">
                                {child.children.map((grandchild) => (
                                  <Link
                                    key={grandchild.id}
                                    href={`/?category=${grandchild.slug}`}
                                    className="text-muted-foreground hover:text-primary flex items-center gap-1 text-xs underline-offset-4 hover:underline"
                                  >
                                    {grandchild.image ? (
                                      <Image
                                        src={grandchild.image}
                                        alt=""
                                        width={10}
                                        height={10}
                                        className="size-2.5 shrink-0 object-contain"
                                      />
                                    ) : (
                                      <Tag className="size-2.5 shrink-0" aria-hidden="true" />
                                    )}
                                    {grandchild.name}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground text-sm">Browse all {category.listingCount} listings in this category.</p>
                    )}
                  </div>
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="border-border bg-card text-muted-foreground flex min-h-36 items-center justify-center rounded-xl border border-dashed p-6 text-center text-sm">
            No categories available.
          </div>
        )}
      </div>
    </div>
  )
}
