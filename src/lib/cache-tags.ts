export const cacheTags = {
  listings: 'listings',
  categories: 'categories',
  legal: 'legal',
  legalDocument: (type: string) => `legal-${type}`,
  sellers: 'sellers',
  categoryListings: (categoryId: string) => `category-listings-${categoryId}`
} as const
