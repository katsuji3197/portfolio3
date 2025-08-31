import React from 'react';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  /** Use level=1 for h1, level=2 for h2 (default) */
  level?: 1 | 2;
};

export default function SectionHeader({
  title,
  subtitle,
  level = 2,
}: SectionHeaderProps) {
  return (
    <div className="flex items-end gap-2">
      {level === 1 ? (
        <h1 className="text-2xl font-bold text-amber-200/80">{title}</h1>
      ) : (
        <h2 className="text-2xl font-bold text-amber-200/80">{title}</h2>
      )}
      {subtitle && (
        <p className="text-sm text-neutral-400 font-medium tracking-wider">
          {subtitle}
        </p>
      )}
    </div>
  );
}
