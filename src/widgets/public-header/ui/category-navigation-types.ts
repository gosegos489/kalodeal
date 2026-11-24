import type { ReactNode } from 'react'

export type HeaderCategory = {
  id: string
  slug: string
  label: string
  href: string
  icon?: ReactNode
  children: HeaderCategory[]
}

export type HeaderCategories = { categories: HeaderCategory[]; unavailable: boolean }
