import type { Metadata } from 'next';
import ProjectCard from '@/components/project-card';
import SectionHeader from '@/components/section-header';
import { getProjects } from '@/lib/microcms';
import type { Project } from '@/data/projects';

export default async function ProjectsIndexPage() {
  const projects: Project[] = await getProjects();

  return (
    <div className="min-h-[70vh]  px-8 sm:px-24 xl:px-48 pt-28 pb-16 text-neutral-100 flex flex-col items-center">
      <div className="flex gap-2 items-end pb-8 w-full justify-start max-w-[1500px]">
        <SectionHeader title="Projects" subtitle="製作実績" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 max-w-[1500px]">
        {projects.map((project: Project) => (
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

export const metadata: Metadata = {
  title: 'Projects — N.Motoki',
  description: '制作実績の一覧ページ。これまでのプロジェクトを紹介します。',
};
