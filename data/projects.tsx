import type { ReactNode } from 'react';

export type Project = {
  id: string;
  imageSrc: string;
  title: string;
  tags: string[];
  description?: string;
  createdAt?: string;
  content?: ReactNode | string;
  liveUrl?: string;
};

// ローカルでのみ表示したい詳細コンテンツがある場合はここでマッピングします。
// 登録した slug は MicroCMS の本文より優先され、サムネイルも非表示になります。
export const LOCAL_PROJECT_CONTENT: Record<string, ReactNode> = {};
