import { ArrowUpRight, Tag } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { CategorySummary } from '../get-category-tree'

export function CategoryCard({ headingLevel = 3, ...category }: CategorySummary & { headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  return (
    <Link
      href={`/?category=${category.slug}`}
      className="focus-visible:ring-ring/50 bg-muted/20 hover:bg-muted/50 flex h-36 flex-col gap-3 p-4 transition-colors outline-none focus-visible:ring-3"
    >
      <span className="flex items-center justify-between">
        <span className="bg-muted text-muted-foreground flex size-9.5 items-center justify-center rounded-lg">
          {category.image ? (
            <Image src={category.image} alt="" width={20} height={20} className="size-5 object-contain" />
          ) : (
            <Tag className="size-5" strokeWidth={1.8} aria-hidden="true" />
          )}
        </span>
        <ArrowUpRight className="text-muted-foreground/60 size-4" aria-hidden="true" />
      </span>

      <div className="flex min-w-0 flex-col gap-0.5">
        <Heading className="truncate text-[15px] font-semibold">{category.name}</Heading>
        <span className="text-muted-foreground truncate text-xs">{category.description || 'Explore local listings'}</span>
        <span className="text-muted-foreground text-[11px] font-medium">
          {`${category.listingCount} ${category.slug === 'jobs' ? 'openings' : 'listings'}`}
        </span>
      </div>
    </Link>
  )
}
