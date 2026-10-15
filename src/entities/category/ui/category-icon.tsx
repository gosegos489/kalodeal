import { Tag, icons } from 'lucide-react'
import { createElement } from 'react'
import 'server-only'
import { getCategoryIconImage } from '../icon-source'
import { CategoryIconImage } from './category-icon-image'

// Keep the Lucide catalogue on the server, including legacy PascalCase,
// kebab-case and lucide: prefixed names. It adds no icon catalogue to client JS.
const namedIcons = new Map(Object.entries(icons).map(([name, icon]) => [name.toLowerCase(), icon]))

export function CategoryIcon({ value, size = 24 }: { value?: string | null; size?: number }) {
  const image = getCategoryIconImage(value)
  if (image) return <CategoryIconImage src={image} size={size} />
  return renderNamedIcon(value, size)
}

function renderNamedIcon(value: string | null | undefined, size: number) {
  const name = value
    ?.trim()
    .replace(/^lucide[:-]/i, '')
    .replace(/[-_\s]/g, '')
    .toLowerCase()
  const Icon = (name && namedIcons.get(name)) || Tag
  return createElement(Icon, { 'aria-hidden': true, width: size, height: size, strokeWidth: 1.8, className: 'shrink-0' })
}
