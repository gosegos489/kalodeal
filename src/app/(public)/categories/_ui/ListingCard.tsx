import type { CategoryListing } from '@/entities/category/get-category-listing'

export default function ListingCard({ listing }: { listing: CategoryListing }) {
  return (
    <div className="bg-card hover:border-primary rounded-lg border p-3 transition-colors">
      <p className="text-secondary-foreground line-clamp-2 text-sm font-medium">{listing.title}</p>
      <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">{listing.description}</p>
      {listing.price !== null && <p className="text-primary mt-2 text-sm font-semibold">{listing.price}</p>}
    </div>
  )
}
