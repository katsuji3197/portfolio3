import type { ReactNode } from 'react';

export type Project = {
  id: string;
  imageSrc: string;
  title: string;
  tags: string[];
  description: string;
  createdAt: string;
  content?: ReactNode;
};

export const PROJECTS: ReadonlyArray<Project> = [
  {
    id: 'cirkithp',
    imageSrc: '/img/samuneir/cirkit.png',
    title: 'CirKit HP',
    tags: ['Next.js', 'Tailwind CSS', 'TypeScript', 'CirKit'],
    description:
      '金沢工業大学の課外活動であり、学生ベンチャーでもある団体のHP。',
    createdAt: '2023-10',
  },
  {
    id: 'alien',
    imageSrc: '/img/samuneir/alien.png',
    title: 'Alien',
    tags: ['Vite', 'Tailwind CSS', 'Javascript', 'Hackathon'],
    description: '長期ハッカソン Tornado 2023で制作したサービス。',
    createdAt: '2023-09',
  },
  {
    id: 'portfolio2',
    imageSrc: '/img/samuneir/folio2.png',
    title: 'Portfolio 2.0',
    tags: ['Next.js', 'Tailwind CSS', 'TypeScript', 'Personal'],
    description: 'ひとつ前のポートフォリオサイト。',
    createdAt: '2023-12',
  },
  {
    id: 'minshoku',
    imageSrc: '/img/samuneir/minshoku.png',
    title: 'nono1 みんなの食堂 HP',
    tags: ['Next.js', 'Tailwind CSS', 'TypeScript', 'CirKit'],
    description: '野々市市の、拠点を持たないこども食堂さんのHP。',
    createdAt: '2024-4',
  },
  {
    id: 'cybozu',
    imageSrc: '/img/samuneir/cybozu.png',
    title: 'Cybozu Office Mobile Improvement',
    tags: ['Design', 'Intern'],
    description:
      '2024年サマーインターンで作成した、Cybozu Officeのモバイルアプリの改善案。',
    createdAt: '2024-09',
  },
  {
    id: 'luminiscape',
    imageSrc: '/img/samuneir/luminiscape.png',
    title: 'LuminiScape',
    tags: ['Next.js', 'Tailwind CSS', 'TypeScript', 'Hackathon'],
    description: '長期ハッカソン Tornado 2024で制作したサービス。',
    createdAt: '2024-09',
  },
  {
    id: 'purpleflair',
    imageSrc: '/img/samuneir/purpleflair.png',
    title: 'Purple Flair',
    tags: ['Next.js', 'Tailwind CSS', 'TypeScript', 'Intern'],
    description:
      '長期インターンで開発中のセキュリティトレーニングプラットフォーム。',
    createdAt: 'Developping',
  },
];
