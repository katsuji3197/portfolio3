'use client';

import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';

interface HobbySwiperProps {
  images: string[];
  title?: string;
}

export default function HobbySwiper({ images, title = '' }: HobbySwiperProps) {
  return (
    <div className="w-full h-40 md:h-56 overflow-hidden rounded-md mb-4 bg-neutral-800/20">
      <Swiper
        modules={[Autoplay]}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        loop={images.length > 1}
        slidesPerView={1}
        className="w-full h-full"
      >
        {images.map((src, idx) => (
          <SwiperSlide key={idx} className="w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`${title} image ${idx + 1}`}
              className="w-full h-full object-cover"
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
