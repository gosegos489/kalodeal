export const cacheTags = {
  listings: 'listings',
  categories: 'categories',
  legal: 'legal',
  categoryListings: (categoryId: string) => `category-listings-${categoryId}`
} as const
