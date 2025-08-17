'use client';

import { useRef } from 'react';
import type { Project } from '@/data/projects';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperClass } from 'swiper';
import { Autoplay } from 'swiper/modules';
import ProjectCard from './project-card';
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
            <ProjectCard
              project={project}
              className="h-full"
              imageClassName="h-48 sm:h-96 md:h-72"
              containerClassName="h-40 justify-center"
              descriptionLines={3}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
