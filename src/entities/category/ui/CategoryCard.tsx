import { ArrowUpRight, Tag } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import type { CategorySummary } from '../get-category-tree'

export function CategoryCard(category: CategorySummary) {
  return (
    <Card className="hover:border-primary h-36 gap-0 rounded-lg border py-0 ring-0 transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:shadow-sm">
      <Link
        href={`/?category=${category.slug}`}
        className="focus-visible:ring-ring/50 flex h-full flex-col gap-3 rounded-lg p-4 outline-none focus-visible:ring-3"
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

        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-[15px] font-semibold">{category.name}</span>
          <span className="text-muted-foreground truncate text-xs">{category.description || 'Explore local listings'}</span>
          <span className="text-muted-foreground text-[11px] font-medium">
            {`${category.listingCount} ${category.slug === 'jobs' ? 'openings' : 'listings'}`}
          </span>
        </span>
      </Link>
    </Card>
  )
}
