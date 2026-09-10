import { getCategoryListings } from '@/entities/category/get-category-listing'
import ListingsSliderClient from './ListingsSlider.client'

export async function CategorySection({ category }: { category: { id: string; name: string } }) {
  const listings = await getCategoryListings(category.id)

  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold">{category.name}</h2>

      {listings.length > 0 ? (
        <ListingsSliderClient listings={listings} />
      ) : (
        <div className="flex h-15 w-full items-center justify-center rounded-lg bg-gray-100 text-center">
          <p>No recent posts</p>
        </div>
      )}
    </section>
  )
}
