import type { Metadata } from 'next';
import SectionHeader from '@/components/section-header';
import ProjectsGridClient from '../../../components/projects-grid-client';

export default function ProjectsIndexPage() {
  return (
    <div className="min-h-[70vh]  px-8 sm:px-24 xl:px-48 pt-28 pb-16 text-neutral-100 flex flex-col items-center">
      <div className="flex gap-2 items-end pb-8 w-full justify-start max-w-[1500px]">
        <SectionHeader title="Projects" subtitle="製作実績" />
      </div>
      <ProjectsGridClient />
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Projects — N.Motoki',
  description: '制作実績の一覧ページ。これまでのプロジェクトを紹介します。',
};
