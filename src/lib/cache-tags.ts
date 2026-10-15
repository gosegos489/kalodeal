export const cacheTags = {
  listings: 'listings',
  categories: 'categories',
  legal: 'legal',
  sellers: 'sellers',
  categoryListings: (categoryId: string) => `category-listings-${categoryId}`
} as const
