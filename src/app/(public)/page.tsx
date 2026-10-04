import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getCategorySummaries } from '@/entities/category/get-category-tree'
import { buildMetadata } from '@/lib/metadata'
import { type HomePageProps, getBrowseContext } from './_lib/browse-context'
import { HomeCategories } from './_ui/home-categories'
import { HomeCategoryFeeds } from './_ui/home-category-feeds'
import { HomeHero } from './_ui/home-hero'
import { HomeListings } from './_ui/home-listings'
import { HeroLoading, HomeLoading, ListingsLoading } from './_ui/home-loading'

export async function generateMetadata({ searchParams }: HomePageProps): Promise<Metadata> {
  const { title, description, path, isSearch } = await getBrowseContext(searchParams)
  return buildMetadata({ title, description, path, ...(isSearch && { robots: { index: false, follow: true } }) })
}

async function HomeContent({ searchParams }: HomePageProps) {
  const categories = await getCategorySummaries()

  return (
    <div className="flex min-w-0 flex-col gap-12 sm:gap-16">
      <Suspense fallback={<HeroLoading />}>
        <HomeHero searchParams={searchParams} categories={categories} />
      </Suspense>
      <section id="listings" aria-labelledby="listings-heading" className="scroll-mt-6">
        <Suspense fallback={<ListingsLoading />}>
          <HomeListings searchParams={searchParams} />
        </Suspense>
      </section>
      <HomeCategories categories={categories} />
      <Suspense fallback={<ListingsLoading />}>
        <HomeCategoryFeeds />
      </Suspense>
    </div>
  )
}

export default function Home({ searchParams }: HomePageProps) {
  return (
    <div className="container py-8 sm:py-10">
      <Suspense fallback={<HomeLoading />}>
        <HomeContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
