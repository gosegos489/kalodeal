import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Badge } from '@/components/ui/badge'
import { CategoryIcon } from '@/entities/category/ui/category-icon'
import { CategoryIconEditor } from '@/features/moderation/categories/category-icon-editor'
import { getCategoryIconEditor } from '@/features/moderation/categories/data'
import { ModerationLoading } from '@/features/moderation/shared/moderation-loading'

type Props = { params: Promise<{ id: string }> }

async function Editor({ params }: Props) {
  const { id } = await params
  const category = await getCategoryIconEditor(id)
  if (!category) notFound()
  return (
    <section className="min-w-0 space-y-6" aria-labelledby="category-icon-heading">
      <Link href="/moderator/categories" className="text-primary text-sm underline underline-offset-4">All category icons</Link>
      <div className="space-y-2">
        <h2 id="category-icon-heading" className="text-2xl font-semibold wrap-anywhere">{category.name}</h2>
        <p className="text-muted-foreground text-sm wrap-anywhere">{category.slug}</p>
        {category.parent ? <Link href={`/moderator/categories/${category.parent.id}`} className="text-primary text-sm underline underline-offset-4">Parent: {category.parent.name}</Link> : <p className="text-muted-foreground text-sm">Main category</p>}
        {!category.isActive && <Badge variant="outline">Inactive category</Badge>}
      </div>
      <CategoryIconEditor key={`${category.id}:${category.updatedAt.toISOString()}`} categoryId={category.id} updatedAt={category.updatedAt.toISOString()} hasIcon={!!category.icon} currentPreview={<CategoryIcon value={category.icon} size={48} />} />
    </section>
  )
}

export default function CategoryIconPage(props: Props) {
  return <Suspense fallback={<ModerationLoading />}><Editor {...props} /></Suspense>
}
