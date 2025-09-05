import React from 'react';

type Props = {
  className?: string;
  imageClassName?: string;
  containerClassName?: string;
};

export default function ProjectCardSkeleton({
  className = '',
  imageClassName = '',
  containerClassName = '',
}: Props) {
  return (
    <div
      className={`animate-pulse bg-neutral-900/30 border w-[95vw] max-w-full h-96 border-neutral-600 rounded-xl overflow-hidden ${className}`}
    >
      <div className={`w-full bg-neutral-800 ${imageClassName} h-40`} />
      <div
        className={`p-4 flex flex-col justify-between gap-2 ${containerClassName}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="h-5 bg-neutral-700 rounded w-2/3" />
          <div className="h-3 bg-neutral-700 rounded w-16" />
        </div>
        <div className="flex flex-wrap gap-1">
          <div className="h-4 bg-neutral-700 rounded w-16" />
          <div className="h-4 bg-neutral-700 rounded w-12" />
        </div>
        <div className="h-12 bg-neutral-700 rounded w-full" />
      </div>
    </div>
  );
}
