import Link from 'next/link';
import Image from 'next/image';
import type { Project } from '@/data/projects';

type ProjectCardProps = {
  project: Project;
  className?: string;
  imageClassName?: string;
  containerClassName?: string;
  descriptionLines?: number;
};

export default function ProjectCard({
  project,
  className = '',
  imageClassName = '',
  containerClassName = '',
  descriptionLines = 3,
}: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className={`block bg-neutral-900/30 border border-neutral-600 rounded-xl overflow-hidden hover:border-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/60 ${className}`}
    >
      <div className={`relative w-full bg-neutral-800 ${imageClassName}`}>
        <Image
          src={project.imageSrc}
          alt={project.title}
          fill
          sizes="(max-width: 640px) 90vw, 320px"
          quality={75}
          className="object-contain opacity-70"
        />
      </div>
      <div className={`p-4 flex flex-col gap-2 ${containerClassName}`}>
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
        <p
          className={`text-sm text-neutral-300 line-clamp-${descriptionLines}`}
        >
          {project.description}
        </p>
      </div>
    </Link>
  );
}
