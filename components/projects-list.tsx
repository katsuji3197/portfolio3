'use client';

import React, { useEffect, useState } from 'react';
import ProjectCard from './project-card';
import ProjectCardSkeleton from './project-card-skeleton';
import type { Project } from '@/data/projects';

type Props = {
  className?: string;
  columns?: string; // unused, hooks into parent grid
  itemCount?: number;
  imageClassName?: string;
  descriptionLines?: number;
};

export default function ProjectsList({
  className = '',
  itemCount = 6,
  imageClassName = 'aspect-video',
  descriptionLines = 2,
}: Props) {
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
      <div className={`grid gap-6 sm:grid-cols-2 xl:grid-cols-3 ${className}`}>
        {Array.from({ length: itemCount }).map((_, i) => (
          <div key={i}>
            <ProjectCardSkeleton
              imageClassName={imageClassName}
              containerClassName="h-40"
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid gap-6 sm:grid-cols-2 xl:grid-cols-3 ${className}`}>
      {projects.map(project => (
        <ProjectCard
          key={project.id}
          project={project}
          imageClassName={imageClassName}
          descriptionLines={descriptionLines}
        />
      ))}
    </div>
  );
}
