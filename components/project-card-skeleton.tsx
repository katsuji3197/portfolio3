export default function ProjectCardSkeleton({
  className = '',
  imageClassName = '',
  containerClassName = '',
}: {
  className?: string;
  imageClassName?: string;
  containerClassName?: string;
}) {
  return (
    <div
      className={`animate-pulse block max-w-[95vw] w-full bg-neutral-900/30 border border-neutral-600 rounded-xl overflow-hidden ${className}`}
    >
      <div className={`relative w-full bg-neutral-800 ${imageClassName}`}>
        <div className="w-full h-full bg-neutral-700" />
      </div>
      <div className={`p-4 flex flex-col gap-2 ${containerClassName}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="h-5 bg-neutral-700 rounded w-3/4" />
          <div className="h-4 bg-neutral-700 rounded w-1/6" />
        </div>
        <div className="flex flex-wrap gap-1">
          <div className="h-6 bg-neutral-700 rounded px-2 py-0.5 w-12" />
          <div className="h-6 bg-neutral-700 rounded px-2 py-0.5 w-14" />
        </div>
        <div className="h-12 bg-neutral-700 rounded w-full" />
      </div>
    </div>
  );
}
