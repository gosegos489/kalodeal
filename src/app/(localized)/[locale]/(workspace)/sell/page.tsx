import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import { getAccount } from '@/features/account/data'
import CreateListingForm from '@/features/create-listing/create-listing-form'
import { getListingCategoryOptions } from '@/features/create-listing/get-category-options'
import { ListingFormSkeleton } from '@/features/create-listing/listing-form-skeleton'
import { Link } from '@/i18n/navigation'

async function SellForm() {
  const [categories, account] = await Promise.all([getListingCategoryOptions(), getAccount()])

  return <CreateListingForm categories={categories} plan={account.plan} listingSlotCount={account.listingSlotCount} />
}

export default function SellPage() {
  const t = useTranslations('Workspace')

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6">
        <Link href="/account/listings" className="text-muted-foreground inline-flex items-center gap-2 text-sm transition-colors">
          <ArrowLeft className="size-4" /> {t('myListings')}
        </Link>
        <div className="flex flex-col gap-4 border-b pb-8 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-3">
            <p className="text-primary text-xs font-semibold uppercase">{t('sellOnKaloDeal')}</p>
            <h1 className="text-3xl font-semibold sm:text-4xl">{t('giveYourItemANewHome')}</h1>
            <p className="text-muted-foreground max-w-xl text-sm leading-relaxed sm:text-base">
              {t('addAFewPhotosTellBuyersWhatMakesItGreatAndPublishYourListing')}
            </p>
          </div>
          <Link href="/how-it-works" className="text-muted-foreground inline-flex shrink-0 items-center gap-1.5 text-sm transition-colors">
            {t('howSellingWorks')} <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>
      <Suspense fallback={<ListingFormSkeleton />}>
        <SellForm />
      </Suspense>
    </div>
  )
}

export async function generateMetadata() {
  const t = await getTranslations('Workspace')
  return { title: t('createListing') }
}
