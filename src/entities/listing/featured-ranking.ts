// At most one priority placement per four results, starting after an organic row.
// Preserve deterministic source order and never repeat an ID.
export function mergeFeaturedListings<T extends { id: string }>(organic: T[], featured: T[], take: number): T[] {
  const priority = featured.slice(0, Math.floor(take / 4))
  const selected = new Set(priority.map(({ id }) => id))
  const normal = organic.filter(({ id }) => !selected.has(id))
  const result: T[] = []
  let normalIndex = 0
  let featuredIndex = 0
  while (result.length < take && (normalIndex < normal.length || featuredIndex < priority.length)) {
    if (result.length % 4 === 1 && featuredIndex < priority.length) result.push(priority[featuredIndex++])
    else if (normalIndex < normal.length) result.push(normal[normalIndex++])
    else result.push(priority[featuredIndex++])
  }
  return result
}
