import Swiper from 'swiper'
import 'swiper/css'
import 'swiper/css/a11y'
import { A11y, Navigation } from 'swiper/modules'

type ListingSwiperOptions = {
  element: HTMLDivElement
  previous: HTMLButtonElement
  next: HTMLButtonElement
  label: string
  initialSlide: number
}

export function createListingSwiper({ element, previous, next, label, initialSlide }: ListingSwiperOptions) {
  return new Swiper(element, {
    modules: [Navigation, A11y],
    slidesPerView: 'auto',
    spaceBetween: 16,
    initialSlide,
    watchOverflow: true,
    speed: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 300,
    navigation: { prevEl: previous, nextEl: next, addIcons: false },
    a11y: {
      containerMessage: label,
      prevSlideMessage: `Previous ${label} listings`,
      nextSlideMessage: `Next ${label} listings`
    }
  })
}
