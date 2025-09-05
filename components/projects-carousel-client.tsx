'use client';

import { useEffect, useState } from 'react';
import ProjectsCarousel from './projects-carousel';
import type { Project } from '@/data/projects';

export default function ProjectsCarouselClient() {
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

  // while loading show skeleton inside ProjectsCarousel (it handles empty array)
  return <ProjectsCarousel projects={projects ?? []} />;
}
