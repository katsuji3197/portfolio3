import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProjectBySlug } from '@/lib/microcms';
import { LOCAL_PROJECT_CONTENT } from '@/data/projects';
import { formatYearMonth } from '@/lib/date-utils';

type PageProps = { params: Promise<{ id: string }> };

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const project = await getProjectBySlug(id);
  if (!project) return notFound();

  return (
    <div className="min-h-[70vh] px-4 sm:px-24 xl:px-48 py-28 text-neutral-100">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{project.title}</h1>
          <span className="text-sm text-neutral-400">
            {formatYearMonth(project.createdAt)}
          </span>
        </div>
        {!LOCAL_PROJECT_CONTENT[project.id] && (
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
        {LOCAL_PROJECT_CONTENT[project.id] ? (
          <div className="text-neutral-200 leading-7">
            {LOCAL_PROJECT_CONTENT[project.id]}
          </div>
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
