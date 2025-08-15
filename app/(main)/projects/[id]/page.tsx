import Image from 'next/image';
import { notFound } from 'next/navigation';
import { PROJECTS } from '@/data/projects';

type PageProps = { params: Promise<{ id: string }> };

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const project = PROJECTS.find(p => p.id === id);
  if (!project) return notFound();

  return (
    <div className="min-h-[70vh] px-4 sm:px-24 xl:px-48 py-28 text-neutral-100">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{project.title}</h1>
          <span className="text-sm text-neutral-400">{project.createdAt}</span>
        </div>
        {!project.content && (
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
        {project.content ? (
          <div className="text-neutral-200 leading-7">{project.content}</div>
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
