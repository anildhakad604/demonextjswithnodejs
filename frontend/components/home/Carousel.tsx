"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";

type CarouselBreakpoints = Record<number, { slidesPerView?: number; spaceBetween?: number }>;

type CarouselProps<T> = {
  items: T[];
  keyOf: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => React.ReactNode;
  slidesPerView?: number;
  breakpoints?: CarouselBreakpoints;
  loop?: boolean;
  autoplay?: boolean;
  pagination?: boolean;
  navigation?: boolean;
  spaceBetween?: number;
  className?: string;
};

export default function Carousel<T>({
  items,
  keyOf,
  renderItem,
  slidesPerView = 2,
  breakpoints,
  loop = false,
  autoplay = false,
  pagination = false,
  navigation = false,
  spaceBetween = 14,
  className,
}: CarouselProps<T>) {
  if (items.length === 0) return null;

  return (
    <Swiper
      modules={[Autoplay, Navigation, Pagination]}
      slidesPerView={slidesPerView}
      spaceBetween={spaceBetween}
      breakpoints={breakpoints}
      loop={loop && items.length > slidesPerView}
      autoplay={autoplay ? { delay: 3500, disableOnInteraction: false } : false}
      pagination={pagination ? { clickable: true } : false}
      navigation={navigation}
      className={className}
    >
      {items.map((item, i) => (
        <SwiperSlide key={keyOf(item, i)}>{renderItem(item, i)}</SwiperSlide>
      ))}
    </Swiper>
  );
}
