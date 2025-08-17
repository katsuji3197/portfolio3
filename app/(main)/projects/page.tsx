import { PROJECTS } from '@/data/projects';
import ProjectCard from '@/components/project-card';

export default function ProjectsIndexPage() {
  return (
    <div className="min-h-[70vh]  px-8 sm:px-24 xl:px-48 pt-28 pb-16 text-neutral-100 flex flex-col items-center">
      <div className="flex gap-2 items-end pb-8 w-full justify-start max-w-[1500px]">
        <h1 className="text-2xl font-bold">Projects</h1>
        <p className="text-sm text-neutral-400">製作実績</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 max-w-[1500px]">
        {PROJECTS.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            imageClassName="aspect-video"
            descriptionLines={2}
          />
        ))}
      </div>
    </div>
  );
}
