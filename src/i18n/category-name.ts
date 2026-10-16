// Slugs stay unchanged; unknown/new categories retain their database display name.
export function categoryName(category: { slug?: string; name: string }, names: Record<string, string>) {
  return category.slug && Object.hasOwn(names, category.slug) ? names[category.slug] : category.name
}
