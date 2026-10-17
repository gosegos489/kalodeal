import { Tag, icons } from 'lucide-react'
import 'server-only'
import { createElement } from 'react'
import { cn } from '@/lib/utils'
import { getCategoryIconImage } from '../icon-source'
import { CategoryIconImage } from './category-icon-image'

// Keep the Lucide catalogue on the server, including legacy PascalCase,
// kebab-case and lucide: prefixed names. It adds no icon catalogue to client JS.
const namedIcons = new Map(Object.entries(icons).map(([name, icon]) => [name.toLowerCase(), icon]))

const variants = {
  card: { size: 80, className: 'size-16 sm:size-20', sizes: '(min-width: 640px) 80px, 64px' },
  navigation: { size: 56, className: 'size-12 xl:size-14', sizes: '(min-width: 1280px) 56px, 48px' }
} as const

export function CategoryIcon({ value, size = 24, variant }: { value?: string | null; size?: number; variant?: keyof typeof variants }) {
  const dimensions = variant ? variants[variant] : { size, className: undefined, sizes: `${size}px` }
  const image = getCategoryIconImage(value)
  if (image) return <CategoryIconImage src={image} {...dimensions} />
  return renderNamedIcon(value, dimensions.size, dimensions.className)
}

function renderNamedIcon(value: string | null | undefined, size: number, className?: string) {
  const name = value
    ?.trim()
    .replace(/^lucide[:-]/i, '')
    .replace(/[-_\s]/g, '')
    .toLowerCase()
  const Icon = (name && namedIcons.get(name)) || Tag
  return createElement(Icon, { 'aria-hidden': true, width: size, height: size, strokeWidth: 1.8, className: cn('shrink-0', className) })
}
