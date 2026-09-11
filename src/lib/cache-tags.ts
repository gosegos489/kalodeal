export const cacheTags = {
  categories: 'categories',
  categoryListings: (categoryId: string) => `category-listings-${categoryId}`
} as const
