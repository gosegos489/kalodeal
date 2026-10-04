'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Swiper as SwiperInstance } from 'swiper'
import { type ReactNode, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import styles from './listing-carousel.module.css'

type ListingCarouselProps = {
  label: string
  slides: { id: string; content: ReactNode }[]
}

export function ListingCarousel({ label, slides }: ListingCarouselProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const previousRef = useRef<HTMLButtonElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const enhanceRef = useRef<(() => void) | null>(null)
  const swiperRef = useRef<SwiperInstance | null>(null)

  useEffect(() => {
    const element = rootRef.current
    const track = trackRef.current
    const previous = previousRef.current
    const next = nextRef.current
    if (!element || !track || !previous || !next) return

    let disposed = false
    let loading = false

    const enhance = async () => {
      if (loading || disposed) return
      loading = true
      try {
        const { createListingSwiper } = await import('./listing-carousel-swiper')
        if (disposed) return
        // Preserve the slide reached with native scrolling before enhancement.
        const slideWidth = track.firstElementChild?.getBoundingClientRect().width ?? 0
        const initialSlide = slideWidth ? Math.round(track.scrollLeft / (slideWidth + 16)) : 0
        track.scrollLeft = 0
        swiperRef.current = createListingSwiper({ element, previous, next, label, initialSlide })
      } catch {
        // Native scrolling and the buttons remain usable if the chunk fails to load.
        loading = false
      }
    }

    enhanceRef.current = enhance
    const observer =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(
            (entries) => {
              if (entries.some((entry) => entry.isIntersecting)) {
                observer?.disconnect()
                void enhance()
              }
            },
            { rootMargin: '200px' }
          )
    if (observer) observer.observe(element)
    else void enhance()

    return () => {
      disposed = true
      observer?.disconnect()
      enhanceRef.current = null
      swiperRef.current?.destroy(true, true)
      swiperRef.current = null
    }
  }, [label, slides])

  function scrollFallback(direction: number) {
    if (swiperRef.current) return // Navigation handles enhanced buttons.
    const track = trackRef.current
    if (!track) return
    track.scrollBy({
      left: direction * (track.clientWidth + 16),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
    })
  }

  return (
    <div
      ref={rootRef}
      role="region"
      aria-label={`${label} listings`}
      className={`swiper relative overflow-hidden pb-1! ${styles.root}`}
      onFocusCapture={() => enhanceRef.current?.()}
      onPointerDownCapture={() => enhanceRef.current?.()}
    >
      <div className="mb-3 flex justify-end gap-2">
        <Button
          ref={previousRef}
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Previous ${label} listings`}
          onClick={() => scrollFallback(-1)}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <Button ref={nextRef} type="button" variant="outline" size="icon" aria-label={`Next ${label} listings`} onClick={() => scrollFallback(1)}>
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
      <div ref={trackRef} className={`swiper-wrapper ${styles.track}`}>
        {slides.map(({ id, content }) => (
          <div
            key={id}
            className="swiper-slide h-auto! w-[85%]! shrink-0 snap-start sm:w-[calc((100%-16px)/2)]! md:w-[calc((100%-32px)/3)]! xl:w-[calc((100%-48px)/4)]!"
          >
            {content}
          </div>
        ))}
      </div>
    </div>
  )
}
