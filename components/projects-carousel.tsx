'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
import type { Project } from '@/data/projects';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperClass } from 'swiper';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';

type ProjectsCarouselProps = {
  projects: ReadonlyArray<Project>;
  className?: string;
};

export default function ProjectsCarousel({
  projects,
  className,
}: ProjectsCarouselProps) {
  const swiperRef = useRef<SwiperClass | null>(null);

  const slidePrev = () => {
    const s = swiperRef.current;
    if (!s) return;
    s.slidePrev();
  };

  const slideNext = () => {
    const s = swiperRef.current;
    if (!s) return;
    s.slideNext();
  };

  return (
    <div className={`relative ${className ?? ''}`}>
      <button
        aria-label="左へスクロール"
        onClick={slidePrev}
        className="absolute left-2 hidden md:block -bottom-16 top-auto cursor-pointer translate-y-0 md:bottom-auto h-12 w-12 md:top-1/2 md:-translate-y-1/2 md:-left-12 z-10 md:h-8 md:w-8 rounded-full bg-neutral-900/60 border border-neutral-500 text-neutral-200 hover:bg-neutral-800/80 backdrop-blur-md"
      >
        <span aria-hidden className="text-neutral-400 text-2xl md:text-lg">
          ←
        </span>
      </button>

      <button
        aria-label="右へスクロール"
        onClick={slideNext}
        className="absolute left-18 -bottom-16 hidden md:block top-auto cursor-pointer translate-y-0 md:left-auto md:-right-12 md:bottom-auto md:top-1/2 md:-translate-y-1/2 z-10 h-12 w-12 md:h-8 md:w-8 rounded-full bg-neutral-900/60 border border-neutral-500 text-neutral-200 hover:bg-neutral-800/80 backdrop-blur-md"
      >
        <span aria-hidden className="text-neutral-400 text-2xl md:text-lg">
          →
        </span>
      </button>

      <Swiper
        modules={[Autoplay]}
        onSwiper={s => {
          swiperRef.current = s;
        }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        loop={true}
        spaceBetween={24}
        slidesPerView={1.1}
        breakpoints={{
          480: { slidesPerView: 1 },
          824: { slidesPerView: 2 },
          1500: { slidesPerView: 3 },
        }}
        className="px-8 py-4"
      >
        {projects.map(project => (
          <SwiperSlide key={project.id} className="h-screen">
            <Link
              href={`/projects/${project.id}`}
              className="block h-full bg-neutral-900/30 border border-neutral-600 rounded-xl overflow-hidden hover:border-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/60"
            >
              <div className="relative h-48 sm:h-96 md:h-72 w-full bg-neutral-800">
                <Image
                  src={project.imageSrc}
                  alt={project.title}
                  fill
                  sizes="(max-width: 640px) 90vw, 320px"
                  className="object-contain"
                />
              </div>
              <div className="p-4 flex flex-col gap-2 h-40 justify-center">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-neutral-100 line-clamp-1">
                    {project.title}
                  </h3>
                  <span className="text-xs text-neutral-400 whitespace-nowrap">
                    {project.createdAt}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {project.tags.map(tag => (
                    <span
                      key={`${project.id}-${tag}`}
                      className="text-xs text-neutral-300 bg-neutral-800/60 border border-neutral-600 rounded px-2 py-0.5"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-neutral-300 line-clamp-3">
                  {project.description}
                </p>
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
