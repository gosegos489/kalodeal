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

type Props = {
  title: string
  images: ListingDetails['images']
  labels?: {
    noPhotos: string
    choose: string
    status: string[]
    photos: string
    photo: string
    previous: string
    next: string
    show: string[]
    alts: string[]
  }
}

export function ListingGallery({ title, images, labels }: Props) {
  const swiperRef = useRef<SwiperInstance | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  if (!images.length) {
    return (
      <div className="bg-muted text-muted-foreground flex aspect-4/3 flex-col items-center justify-center gap-3 rounded-2xl border">
        <ImageIcon aria-hidden="true" className="size-12" strokeWidth={1.5} />
        <p className="text-sm">{labels?.noPhotos ?? 'No photos available'}</p>
      </div>
    )
  }

  return (
    <section aria-label={labels?.photos ?? `${title} photos`} className="min-w-0 space-y-3">
      <div className="relative">
        <Swiper
          modules={[A11y, Keyboard]}
          slidesPerView={1}
          keyboard={{ enabled: true, onlyInViewport: true }}
          watchOverflow
          rewind={images.length > 1}
          onSwiper={(swiper) => {
            swiperRef.current = swiper
          }}
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          onBeforeInit={(swiper) => {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) swiper.params.speed = 0
          }}
          a11y={{
            containerMessage: labels?.photos ?? `${title} photos`,
            itemRoleDescriptionMessage: labels?.photo ?? 'Photo',
            slideLabelMessage: '{{index}} of {{slidesLength}}'
          }}
          className="bg-muted overflow-hidden rounded-2xl border"
        >
          {images.map((image, index) => (
            <SwiperSlide key={image.id}>
              <div className="relative aspect-4/3">
                <Image
                  src={image.url}
                  alt={labels?.alts[index] ?? `${title} — photo ${index + 1}`}
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
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-between px-3 sm:px-4">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="bg-background/80 hover:bg-background pointer-events-auto size-11 rounded-full shadow-sm backdrop-blur-sm"
              aria-label={labels?.previous ?? 'Previous photo'}
              onClick={() => swiperRef.current?.slidePrev()}
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="bg-background/80 hover:bg-background pointer-events-auto size-11 rounded-full shadow-sm backdrop-blur-sm"
              aria-label={labels?.next ?? 'Next photo'}
              onClick={() => swiperRef.current?.slideNext()}
            >
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>
      {images.length > 1 && (
        <>
          <p aria-live="polite" aria-atomic="true" className="text-muted-foreground text-xs">
            {labels?.status[activeIndex] ?? `Photo ${activeIndex + 1} of ${images.length}`}
          </p>
          <div aria-label={labels?.choose ?? 'Choose a photo'} className="flex gap-3 overflow-x-auto p-1">
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                aria-label={labels?.show[index] ?? `Show photo ${index + 1}`}
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
