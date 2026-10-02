'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import 'swiper/css'
import 'swiper/css/a11y'
import { A11y, Navigation } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

type ListingCarouselProps = {
  label: string
  slides: { id: string; content: ReactNode }[]
}

export function ListingCarousel({ label, slides }: ListingCarouselProps) {
  return (
    <Swiper
      modules={[Navigation, A11y]}
      slidesPerView="auto"
      spaceBetween={16}
      watchOverflow
      navigation={{
        prevEl: '.listing-carousel-previous',
        nextEl: '.listing-carousel-next',
        addIcons: false
      }}
      a11y={{
        containerMessage: label,
        prevSlideMessage: `Previous ${label} listings`,
        nextSlideMessage: `Next ${label} listings`
      }}
      onBeforeInit={(swiper) => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) swiper.params.speed = 0
      }}
      className="pb-1!"
      wrapperClass="items-stretch"
    >
      <div slot="container-start" className="mb-3 flex justify-end gap-2">
        <Button type="button" variant="outline" size="icon" className="listing-carousel-previous" aria-label={`Previous ${label} listings`}>
          <ChevronLeft aria-hidden="true" />
        </Button>
        <Button type="button" variant="outline" size="icon" className="listing-carousel-next" aria-label={`Next ${label} listings`}>
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
      {slides.map(({ id, content }) => (
        <SwiperSlide key={id} className="h-auto! w-[85%]! sm:w-[calc((100%-16px)/2)]! md:w-[calc((100%-32px)/3)]! xl:w-[calc((100%-48px)/4)]!">
          {content}
        </SwiperSlide>
      ))}
    </Swiper>
  )
}
