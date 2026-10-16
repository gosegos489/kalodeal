'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  labels?: { view: string; photos: string; alts: string[]; show: string[]; status: string[]; unavailable: string }
  images: string[]
  title: string
  href: string
  sizes: string
  eager: boolean
  prefetch?: false
}

export function ListingCardImages({ images, title, href, sizes, eager, prefetch, labels }: Props) {
  const [preview, setPreview] = useState({ active: 0, displayed: 0, visited: [0], loaded: [0], failed: false })
  const gesture = useRef<{ id: number; x: number; y: number } | null>(null)
  const suppressClick = useRef(false)

  function showPhoto(index: number) {
    setPreview((current) => {
      if (current.active === index) return current
      return {
        ...current,
        active: index,
        displayed: current.loaded.includes(index) ? index : current.displayed,
        visited: current.visited.includes(index) ? current.visited : [...current.visited, index],
        failed: false
      }
    })
  }

  return (
    <div
      className="swiper-no-swiping relative"
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse') showPhoto(0)
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) showPhoto(0)
      }}
    >
      <Link
        href={href}
        prefetch={prefetch}
        aria-label={labels?.view ?? `View listing: ${title}`}
        className="bg-muted focus-visible:ring-ring relative block aspect-4/3 touch-pan-y overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-inset"
        onPointerDown={(event) => {
          suppressClick.current = false
          if (event.pointerType === 'mouse' || !event.isPrimary) return
          // A photo swipe belongs to this card, including inside a listing-feed carousel.
          event.stopPropagation()
          gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
          event.currentTarget.setPointerCapture(event.pointerId)
        }}
        onTouchStart={(event) => event.stopPropagation()}
        onPointerMove={(event) => {
          if (event.pointerType !== 'mouse' || event.buttons !== 0) return
          const bounds = event.currentTarget.getBoundingClientRect()
          const index = Math.max(0, Math.min(images.length - 1, Math.floor(((event.clientX - bounds.left) / bounds.width) * images.length)))
          showPhoto(index)
        }}
        onPointerUp={(event) => {
          const start = gesture.current
          if (!start || start.id !== event.pointerId) return
          gesture.current = null
          const dx = event.clientX - start.x
          const dy = event.clientY - start.y
          if (Math.abs(dx) < 40 || Math.abs(dx) <= Math.abs(dy)) return
          event.preventDefault()
          event.stopPropagation()
          suppressClick.current = true
          showPhoto((preview.active + (dx < 0 ? 1 : -1) + images.length) % images.length)
        }}
        onPointerCancel={(event) => {
          if (gesture.current?.id === event.pointerId) gesture.current = null
        }}
        onClick={(event) => {
          if (!suppressClick.current) return
          event.preventDefault()
          event.stopPropagation()
          suppressClick.current = false
        }}
      >
        {preview.visited.map((index) => (
          <Image
            key={images[index]}
            src={images[index]}
            alt={index === preview.displayed ? (labels?.alts[index] ?? `${title} — photo ${index + 1}`) : ''}
            aria-hidden={index !== preview.displayed}
            fill
            sizes={sizes}
            loading={index === 0 && eager ? 'eager' : 'lazy'}
            className={cn(
              'object-cover transition-opacity duration-150 motion-reduce:transition-none',
              index === preview.displayed ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={() => {
              setPreview((current) => ({
                ...current,
                loaded: current.loaded.includes(index) ? current.loaded : [...current.loaded, index],
                displayed: current.active === index ? index : current.displayed
              }))
            }}
            onError={() => {
              setPreview((current) => ({
                ...current,
                active: current.active === index ? current.displayed : current.active,
                visited: index === 0 ? current.visited : current.visited.filter((visited) => visited !== index),
                failed: current.active === index || current.failed
              }))
            }}
          />
        ))}
      </Link>
      <div
        role="group"
        aria-label={labels?.photos ?? `Preview photos: ${title}`}
        className="pointer-events-none absolute inset-x-0 bottom-0 flex bg-linear-to-t from-black/60 to-transparent px-2"
      >
        {images.map((url, index) => (
          <button
            key={url}
            type="button"
            aria-label={labels?.show[index] ?? `Preview photo ${index + 1} of ${images.length}: ${title}`}
            aria-pressed={preview.displayed === index}
            className="group/photo focus-visible:ring-ring pointer-events-auto flex h-11 min-w-0 flex-1 cursor-pointer items-center px-0.5 outline-none focus-visible:ring-2 focus-visible:ring-inset"
            onPointerDown={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
            onPointerEnter={(event) => {
              if (event.pointerType === 'mouse') showPhoto(index)
            }}
            onFocus={() => showPhoto(index)}
            onClick={(event) => {
              event.stopPropagation()
              showPhoto(index)
            }}
          >
            <span
              aria-hidden="true"
              className={cn(
                'h-1 w-full rounded-full transition-colors motion-reduce:transition-none',
                preview.displayed === index ? 'bg-white' : 'bg-white/45 group-hover/photo:bg-white/75'
              )}
            />
          </button>
        ))}
      </div>
      <span role="status" className="sr-only">
        {preview.failed
          ? (labels?.unavailable ?? 'Photo unavailable. Showing the previous photo.')
          : (labels?.status[preview.displayed] ?? `Photo ${preview.displayed + 1} of ${images.length}`)}
      </span>
    </div>
  )
}
