'use client'

import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react'
import Image from 'next/image'
import type { Swiper as SwiperInstance } from 'swiper'
import 'swiper/css'
import 'swiper/css/a11y'
import { A11y, Keyboard } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ListingDetails } from '../types'

type Props = { title: string; images: ListingDetails['images'] }

export function ListingGallery({ title, images }: Props) {
  const swiperRef = useRef<SwiperInstance | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  if (!images.length) {
    return (
      <div className="bg-muted text-muted-foreground flex aspect-4/3 flex-col items-center justify-center gap-3 rounded-2xl border">
        <ImageIcon aria-hidden="true" className="size-12" strokeWidth={1.5} />
        <p className="text-sm">No photos available</p>
      </div>
    )
  }

  return (
    <section aria-label={`${title} photos`} className="min-w-0 space-y-3">
      <Swiper
        modules={[A11y, Keyboard]}
        slidesPerView={1}
        keyboard={{ enabled: true, onlyInViewport: true }}
        watchOverflow
        onSwiper={(swiper) => {
          swiperRef.current = swiper
        }}
        onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
        onBeforeInit={(swiper) => {
          if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) swiper.params.speed = 0
        }}
        a11y={{ containerMessage: `${title} photos`, itemRoleDescriptionMessage: 'Photo', slideLabelMessage: '{{index}} of {{slidesLength}}' }}
        className="bg-muted overflow-hidden rounded-2xl border"
      >
        {images.map((image, index) => (
          <SwiperSlide key={image.id}>
            <div className="relative aspect-4/3">
              <Image
                src={image.url}
                alt={`${title} — photo ${index + 1}`}
                fill
                sizes="(max-width: 1023px) calc(100vw - 32px), (max-width: 1279px) calc(100vw - 424px), 856px"
                loading={index === 0 ? 'eager' : 'lazy'}
                className="object-contain"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      {images.length > 1 && (
        <>
          <div className="flex items-center justify-between gap-3">
            <p aria-live="polite" aria-atomic="true" className="text-muted-foreground text-xs">
              Photo {activeIndex + 1} of {images.length}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Previous photo"
                disabled={activeIndex === 0}
                onClick={() => swiperRef.current?.slidePrev()}
              >
                <ChevronLeft aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Next photo"
                disabled={activeIndex === images.length - 1}
                onClick={() => swiperRef.current?.slideNext()}
              >
                <ChevronRight aria-hidden="true" />
              </Button>
            </div>
          </div>
          <div aria-label="Choose a photo" className="flex gap-3 overflow-x-auto p-1">
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                aria-label={`Show photo ${index + 1}`}
                aria-pressed={activeIndex === index}
                onClick={() => swiperRef.current?.slideTo(index)}
                className={cn(
                  'bg-muted focus-visible:ring-ring relative size-20 shrink-0 overflow-hidden rounded-lg border outline-none focus-visible:ring-2',
                  activeIndex === index ? 'border-primary ring-primary ring-2' : 'hover:border-primary/50'
                )}
              >
                <Image src={image.url} alt="" fill sizes="80px" className="object-contain" />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
