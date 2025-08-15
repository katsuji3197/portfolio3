import Link from 'next/link';
import { PROJECTS } from '@/data/projects';
import Image from 'next/image';

export default function ProjectsIndexPage() {
  return (
    <div className="min-h-[70vh] px-8 sm:px-24 xl:px-48 pt-28 pb-16 text-neutral-100">
      <div className="flex gap-2 items-end pb-8">
        <h1 className="text-2xl font-bold">Projects</h1>
        <p className="text-sm text-neutral-400">製作実績</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {PROJECTS.map(p => (
          <Link
            key={p.id}
            href={`/projects/${p.id}`}
            className="block bg-neutral-900/30 border border-neutral-600 rounded-xl overflow-hidden hover:border-neutral-400 transition-colors"
          >
            <div className="relative aspect-video w-full bg-neutral-800">
              <Image
                src={p.imageSrc}
                alt={p.title}
                fill
                className="object-contain"
              />
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-neutral-100 line-clamp-1">
                  {p.title}
                </h2>
                <span className="text-xs text-neutral-400 whitespace-nowrap">
                  {p.createdAt}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 pt-2">
                {p.tags.map(tag => (
                  <span
                    key={`${p.id}-${tag}`}
                    className="text-xs text-neutral-300 bg-neutral-800/60 border border-neutral-600 rounded px-2 py-0.5"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-sm text-neutral-300 line-clamp-2 mt-2">
                {p.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
