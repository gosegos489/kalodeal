import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import { useTranslations } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { getListingCategoryOptions } from '@/features/create-listing/get-category-options'
import { ListingForm } from '@/features/create-listing/listing-form'
import { ListingFormSkeleton } from '@/features/create-listing/listing-form-skeleton'
import { getEditableListing } from '@/features/edit-listing/data'
import { categoryName as localizeCategoryName } from '@/i18n/category-name'
import { Link } from '@/i18n/navigation'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Workspace')
  return { title: t('editListing'), robots: { index: false, follow: false } }
}

async function EditListing({ params }: Props) {
  const t = await getTranslations('Workspace')

  const messages = await getMessages()
  const { id } = await params
  const [listing, categories] = await Promise.all([getEditableListing(id), getListingCategoryOptions()])
  if (!listing) notFound()
  const { categoryName, categorySlug, ...editableListing } = listing
  // Keep the current value visible even if its category is no longer in navigation.
  const options = categories.some((category) => category.id === listing.values.categoryId)
    ? categories
    : [
        {
          id: listing.values.categoryId,
          name: t('valueCurrentCategory', { value0: localizeCategoryName({ name: categoryName, slug: categorySlug }, messages.CategoryNames) }),
          slug: categorySlug,
          parentId: null
        },
        ...categories
      ]

  return <ListingForm mode="edit" key={listing.id} categories={options} listing={editableListing} />
}

export default function EditListingPage({ params }: Props) {
  const t = useTranslations('Workspace')

  return (
    <section className="flex min-w-0 flex-col gap-6" aria-labelledby="edit-listing-heading">
      <Link href="/account/listings" className="text-muted-foreground inline-flex items-center gap-2 text-sm">
        <ArrowLeft aria-hidden="true" className="size-4" /> {t('myListings')}
      </Link>
      <div>
        <h2 id="edit-listing-heading" className="text-2xl font-semibold">
          {t('editListing')}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">{t('updateYourItemDetailsAndContactInformation')}</p>
      </div>
      <Suspense fallback={<ListingFormSkeleton />}>
        <EditListing params={params} />
      </Suspense>
    </section>
  )
}
