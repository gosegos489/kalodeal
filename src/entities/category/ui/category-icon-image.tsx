'use client'

import { Tag } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function CategoryIconImage({
  src,
  size = 24,
  className,
  sizes = `${size}px`
}: {
  src: string
  size?: number
  className?: string
  sizes?: string
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null)
  if (failedSource === src) return <Tag aria-hidden="true" width={size} height={size} strokeWidth={1.8} className={cn('shrink-0', className)} />
  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      sizes={sizes}
      className={cn('shrink-0 object-contain', className)}
      style={className ? undefined : { width: size, height: size }}
      unoptimized={src.startsWith('http:') || src.startsWith('blob:')}
      onError={() => setFailedSource(src)}
    />
  )
}
