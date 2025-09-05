'use client';

import React, { useEffect, useState } from 'react';
import ProjectsCarousel from './projects-carousel';
import ProjectCardSkeleton from './project-card-skeleton';
import type { Project } from '@/data/projects';

type Props = {
  className?: string;
};

export default function ProjectsCarouselClient({ className = '' }: Props) {
  const [projects, setProjects] = useState<Project[] | null>(null);
  useEffect(() => {
    let mounted = true;
    fetch('/api/projects')
      .then(r => r.json())
      .then((data: Project[]) => {
        if (!mounted) return;
        setProjects(data);
      })
      .catch(() => {
        if (!mounted) return;
        setProjects([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (!projects) {
    // show skeleton carousel: simple grid of skeleton cards inside a container
    return (
      <div className={`px-8 py-4 ${className}`}>
        <div className="flex gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-[320px]">
              <ProjectCardSkeleton
                imageClassName="h-48 sm:h-96 md:h-72"
                containerClassName="h-40"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <ProjectsCarousel projects={projects} className={className} />;
}
