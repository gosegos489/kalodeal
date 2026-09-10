'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import type { ListingsSliderProps } from '../_types/categories'

const ListingsSlider = dynamic(() => import('./ListingsSlider').then((mod) => mod.ListingsSlider), {
  ssr: false,
  loading: () => <Skeleton className="h-40 w-full" />
})

export default function ListingsSliderClient(props: ListingsSliderProps) {
  return <ListingsSlider {...props} />
}
