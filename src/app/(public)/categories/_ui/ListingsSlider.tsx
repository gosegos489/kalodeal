'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Swiper as SwiperInstance } from 'swiper'
import 'swiper/css'
import { Swiper, SwiperSlide } from 'swiper/react'
import { useRef } from 'react'
import type { ListingsSliderProps } from '../_types/categories'
import ListingCard from './ListingCard'

export function ListingsSlider({ listings }: ListingsSliderProps) {
  const swiperRef = useRef<SwiperInstance | null>(null)

  return (
    <div className="relative">
      <Swiper
        onSwiper={(swiper) => {
          swiperRef.current = swiper
        }}
        spaceBetween={16}
        slidesPerView={2.2}
        breakpoints={{
          640: {
            slidesPerView: 3
          },
          1024: {
            slidesPerView: 4.5
          }
        }}
      >
        {listings.map((listing) => (
          <SwiperSlide key={listing.id}>
            <ListingCard listing={listing} />
          </SwiperSlide>
        ))}
      </Swiper>

      <button
        type="button"
        aria-label="Previous listings"
        onClick={() => swiperRef.current?.slidePrev()}
        className="bg-primary text-primary-foreground absolute top-1/2 left-0 z-10 -translate-x-4 -translate-y-1/2 rounded-full p-1.5 shadow"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <button
        type="button"
        aria-label="Next listings"
        onClick={() => swiperRef.current?.slideNext()}
        className="bg-primary text-primary-foreground absolute top-1/2 right-0 z-10 translate-x-4 -translate-y-1/2 rounded-full p-1.5 shadow"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
