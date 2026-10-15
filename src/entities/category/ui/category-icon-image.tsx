'use client'

import { Tag } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

export function CategoryIconImage({ src, size = 24 }: { src: string; size?: number }) {
  const [failedSource, setFailedSource] = useState<string | null>(null)
  if (failedSource === src) return <Tag aria-hidden="true" width={size} height={size} strokeWidth={1.8} className="shrink-0" />
  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      sizes={`${size}px`}
      className="shrink-0 object-contain"
      style={{ width: size, height: size }}
      unoptimized={src.startsWith('http:') || src.startsWith('blob:')}
      onError={() => setFailedSource(src)}
    />
  )
}
