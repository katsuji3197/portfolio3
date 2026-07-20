import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProjectBySlug } from '@/lib/microcms';
import { LOCAL_PROJECT_CONTENT } from '@/data/projects';
import { formatYearMonth } from '@/lib/date-utils';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

type PageProps = { params: Promise<{ id: string }> };

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const project = await getProjectBySlug(id);
  if (!project) return notFound();

  const hasLocalContent = !!LOCAL_PROJECT_CONTENT[project.id];
  const hasApiContent = typeof project.content === 'string' && project.content.trim() !== '';
  const hasDetailContent = hasLocalContent || hasApiContent;

  return (
    <div className="min-h-[70vh] px-4 sm:px-24 xl:px-48 py-28 text-neutral-100">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{project.title}</h1>
          <span className="text-sm text-neutral-400">
            {formatYearMonth(project.createdAt)}
          </span>
        </div>
        {!hasLocalContent && (
          <div className="relative w-full h-72 bg-neutral-800 border border-neutral-600 rounded-lg overflow-hidden">
            <Image
              src={project.imageSrc}
              alt={project.title}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        )}
        <div className="flex gap-2 flex-wrap">
          {project.tags.map(tag => (
            <span
              key={`${project.id}-detail-${tag}`}
              className="text-xs text-neutral-200 bg-neutral-800/60 border border-neutral-600 rounded px-2 py-0.5"
            >
              {tag}
            </span>
          ))}
        </div>

        {project.liveUrl && (
          <div className="flex justify-start pt-2">
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-neutral-500 rounded-lg text-sm text-neutral-100 hover:text-white transition-all duration-300 font-medium group shadow-lg shadow-black/40"
            >
              <span>プロジェクトを見る / Live Site</span>
              <ArrowTopRightOnSquareIcon className="w-4 h-4 text-neutral-400 group-hover:text-neutral-200 transition-colors" />
            </a>
          </div>
        )}

        {project.description && hasDetailContent && (
          <p className="text-neutral-300 text-base leading-relaxed border-l-2 border-neutral-700 pl-4 my-2">
            {project.description}
          </p>
        )}

        {hasLocalContent ? (
          <div className="text-neutral-200 leading-7">
            {LOCAL_PROJECT_CONTENT[project.id]}
          </div>
        ) : hasApiContent ? (
          <div
            className="prose-custom"
            dangerouslySetInnerHTML={{ __html: project.content as string }}
          />
        ) : (
          <div>
            <p className="text-neutral-200 leading-7">{project.description}</p>
            <div className="text-neutral-400 pt-48 text-lg flex justify-center items-center">
              <div className="flex gap-4 items-center animate-glow p-3 bg-neutral-900/10 border backdrop-blur-xl rounded-md w-fit">
                <p>⚠</p>
                <p>
                  このページは現在誠意制作中です。
                  <br />
                  もうしばらくお待ちください。
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const project = await getProjectBySlug(id);
  if (!project) return { title: 'Project — N.Motoki' };

  return {
    title: `${project.title} — N.Motoki`,
    description: project.description ?? project.title,
  };
}
