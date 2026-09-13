import { getListings, listingFiltersSchema } from '@/entities/listing/get-listings'
import { Suspense } from 'react'

type Props = {
  searchParams: Promise<{ q?: string; category?: string }>
}

export default function Home({ searchParams }: Props) {
  return (
    <div className="container py-10">
      <Suspense fallback={<p className="text-muted-foreground">Loading listings...</p>}>
        <ListingResults searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function ListingResults({ searchParams }: Props) {
  const { q, category } = await searchParams
  const result = listingFiltersSchema.safeParse({ query: q, category })
  const filters = result.success ? result.data : {}
  const listings = await getListings(filters)
  const search = filters.query
  const categorySlug = filters.category
  const title = search ? `Results for “${search}”` : categorySlug ? `Listings in ${categorySlug.replaceAll('-', ' ')}` : 'Latest listings'

  return (
    <>
      <h1 className="text-3xl font-bold">{title}</h1>

      {listings.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <article key={listing.id} className="border-border bg-card rounded-xl border p-4">
              <p className="text-muted-foreground text-xs">{listing.category.name}</p>
              <h2 className="mt-1 font-semibold">{listing.title}</h2>
              <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">{listing.description}</p>
              {listing.price !== null && <p className="mt-3 font-semibold">${listing.price}</p>}
            </article>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground mt-6">{search || categorySlug ? 'No listings match your filters.' : 'No listings yet.'}</p>
      )}
    </>
  )
}
