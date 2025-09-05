'use client';

import { useEffect, useState } from 'react';
import ProjectCard from './project-card';
import ProjectCardSkeleton from './project-card-skeleton';
import type { Project } from '@/data/projects';

export default function ProjectsGridClient() {
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
