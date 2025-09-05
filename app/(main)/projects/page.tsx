import type { Metadata } from 'next';
import SectionHeader from '@/components/section-header';
import ProjectsList from '@/components/projects-list';
import ProjectCardSkeleton from '@/components/project-card-skeleton';
import { Suspense } from 'react';

export default function ProjectsIndexPage() {
  return (
    <div className="min-h-[70vh]  px-8 sm:px-24 xl:px-48 pt-28 pb-16 text-neutral-100 flex flex-col items-center">
      <div className="flex gap-2 items-end pb-8 w-full justify-start max-w-[1500px]">
        <SectionHeader title="Projects" subtitle="製作実績" />
      </div>

      <Suspense
        fallback={
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 max-w-[1500px]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <ProjectCardSkeleton
                  imageClassName="aspect-video h-40"
                  containerClassName="h-40"
                />
              </div>
            ))}
          </div>
        }
      >
        <ProjectsList />
      </Suspense>
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Projects — N.Motoki',
  description: '制作実績の一覧ページ。これまでのプロジェクトを紹介します。',
};
