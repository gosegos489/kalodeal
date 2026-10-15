type Category = { id: string; name: string; slug: string; parentId: string | null }

export function getSellerCategoryFilters(categories: Category[], counts: { categoryId: string; count: number }[]) {
  const byId = new Map(categories.map((category) => [category.id, category]))
  const totals = new Map<string, number>()
  for (const { categoryId, count } of counts) {
    let id: string | null = categoryId
    const visited = new Set<string>()
    while (id && !visited.has(id)) {
      visited.add(id)
      totals.set(id, (totals.get(id) ?? 0) + count)
      id = byId.get(id)?.parentId ?? null
    }
  }
  return categories
    .filter(({ id }) => (totals.get(id) ?? 0) > 0)
    .map((category) => {
      const ancestors: string[] = []
      let parent = category.parentId
      const visited = new Set([category.id])
      while (parent && !visited.has(parent)) {
        visited.add(parent)
        const item = byId.get(parent)
        if (!item) break
        ancestors.unshift(item.name)
        parent = item.parentId
      }
      return { ...category, count: totals.get(category.id) ?? 0, label: [...ancestors, category.name].join(' / ') }
    })
}

export function getSellerCategoryIds(categories: Category[], slug: string) {
  const selected = categories.find((category) => category.slug === slug)
  if (!selected) return []
  const ids = new Set([selected.id])
  // Traverse all existing hierarchy levels, guarding against malformed cycles.
  let changed = true
  while (changed) {
    changed = false
    for (const category of categories) {
      if (category.parentId && ids.has(category.parentId) && !ids.has(category.id)) {
        ids.add(category.id)
        changed = true
      }
    }
  }
  return [...ids]
}
