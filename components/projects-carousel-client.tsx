'use client';

import { useEffect, useState } from 'react';
import ProjectsCarousel from './projects-carousel';
import type { Project } from '@/data/projects';

export default function ProjectsCarouselClient() {
  const [projects, setProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch('/api/projects', { signal: controller.signal });
        // attempt to parse JSON body (if any)
        let data: unknown = null;
        try {
          data = await res.json();
        } catch (parseErr) {
          data = null;
        }

        if (!mounted) return;

        if (!res.ok) {
          // console.error('Failed to fetch projects', res.status, data);
          setProjects([]);
          return;
        }

        if (!Array.isArray(data)) {
          setProjects([]);
          return;
        }

        setProjects(data);
      } catch (e) {
        if (!mounted) return;
        setProjects([]);
      }
    })();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  // while loading show skeleton inside ProjectsCarousel (it handles empty array)
  return <ProjectsCarousel projects={projects ?? []} />;
}
