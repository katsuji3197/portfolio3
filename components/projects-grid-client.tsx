'use client';

import { useEffect, useState } from 'react';
import ProjectCard from './project-card';
import ProjectCardSkeleton from './project-card-skeleton';
import type { Project } from '@/data/projects';

export default function ProjectsGridClient() {
  const [projects, setProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch('/api/projects', { signal: controller.signal });
        let data: unknown = null;
        try {
          data = await res.json();
        } catch (parseErr) {
          data = null;
        }

        if (!mounted) return;

        if (!res.ok) {
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

  if (!projects) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 max-w-[1500px] w-full">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProjectCardSkeleton key={i} imageClassName="aspect-video" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 max-w-[1500px] w-full">
      {projects.map(project => (
        <ProjectCard
          key={project.id}
          project={project}
          imageClassName="aspect-video"
          descriptionLines={2}
        />
      ))}
    </div>
  );
}
