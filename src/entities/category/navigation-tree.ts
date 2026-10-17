export type CategoryNavigationNode = {
  id: string
  name: string
  slug: string
  icon: string | null
  children: CategoryNavigationNode[]
}

// Input is already sorted and active-only. Starting at roots also excludes
// descendants of inactive/missing ancestors and disconnected malformed cycles.
export function buildCategoryNavigationTree(categories: (Omit<CategoryNavigationNode, 'children'> & { parentId: string | null })[]) {
  const nodes = new Map<string, CategoryNavigationNode>(categories.map(({ id, name, slug, icon }) => [id, { id, name, slug, icon, children: [] }]))
  const roots: CategoryNavigationNode[] = []
  for (const category of categories) {
    const node = nodes.get(category.id)
    if (!node) continue
    if (category.parentId === null) roots.push(node)
    else nodes.get(category.parentId)?.children.push(node)
  }
  return roots
}
