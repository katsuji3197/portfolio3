import type { ReactNode } from 'react';
import CirkitHp from './projects/cirkit-hp';

export type Project = {
  id: string;
  imageSrc: string;
  title: string;
  tags: string[];
  description?: string;
  createdAt?: string;
  content?: ReactNode;
};

// ローカルでのみ表示したい詳細コンテンツがある場合はここでマッピングします
export const LOCAL_PROJECT_CONTENT: Record<string, ReactNode> = {
  cirkithp: <CirkitHp />,
};
