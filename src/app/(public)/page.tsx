import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getHomepageCategories } from '@/entities/category/get-homepage-categories'
import { buildMetadata } from '@/lib/metadata'
import { type HomePageProps, getBrowseContext } from './_lib/browse-context'
import { HomeCategories } from './_ui/home-categories'
import { HomeHero } from './_ui/home-hero'
import { HomeListings } from './_ui/home-listings'
import { HeroLoading, HomeLoading, ListingsLoading } from './_ui/home-loading'

export async function generateMetadata({ searchParams }: HomePageProps): Promise<Metadata> {
  const { title, description, path, isSearch } = await getBrowseContext(searchParams)
  return buildMetadata({ title, description, path, ...(isSearch && { robots: { index: false, follow: true } }) })
}

async function HomeContent({ searchParams }: HomePageProps) {
  const categories = await getHomepageCategories()

  return (
    <div className="flex min-w-0 flex-col gap-12 sm:gap-16">
      <HomeCategories categories={categories} />
      <Suspense fallback={<HeroLoading />}>
        <HomeHero searchParams={searchParams} categories={categories} />
      </Suspense>
      <section id="listings" aria-labelledby="listings-heading" className="scroll-mt-6">
        <Suspense fallback={<ListingsLoading />}>
          <HomeListings searchParams={searchParams} />
        </Suspense>
      </section>
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
