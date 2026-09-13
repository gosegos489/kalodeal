export const cacheTags = {
  listings: 'listings',
  categories: 'categories',
  categoryListings: (categoryId: string) => `category-listings-${categoryId}`
} as const
